const User = require('../models/User');
const { encrypt, decrypt } = require('./tokenCrypto');

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Short-lived access tokens, kept in memory per user so most calendar requests
// don't need a round trip to Google's token endpoint.
const accessTokens = new Map(); // userId -> { token, expiresAt }

class GoogleReauthError extends Error {
  constructor() {
    super('Google access expired — please sign in again.');
    this.code = 'GOOGLE_REAUTH';
  }
}

async function exchangeCode(code, redirectUri) {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!resp.ok) {
    // e.g. invalid_client = wrong secret, redirect_uri_mismatch, invalid_grant = code reused/expired
    const body = await resp.json().catch(() => ({}));
    console.error(`Google code exchange failed (${resp.status}): ${body.error} ${body.error_description || ''}`);
    return null;
  }
  return resp.json();
}

async function fetchProfile(accessToken) {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  const profile = await resp.json();
  if (typeof profile.email !== 'string' || profile.email_verified !== true) return null;
  return profile;
}

function cacheAccessToken(userId, token, expiresIn) {
  // Refresh a minute early so a token never expires mid-request
  accessTokens.set(userId, { token, expiresAt: Date.now() + (expiresIn - 60) * 1000 });
}

async function getAccessToken(userId) {
  const cached = accessTokens.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const user = await User.findById(userId).select('+googleRefreshToken');
  if (!user?.googleRefreshToken) throw new GoogleReauthError();

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: decrypt(user.googleRefreshToken),
      grant_type: 'refresh_token',
    }),
  });
  if (!resp.ok) {
    // invalid_grant means the user revoked access or the token expired — forget it
    // so the next sign-in asks Google for a fresh one.
    const body = await resp.json().catch(() => ({}));
    if (body.error === 'invalid_grant') {
      await User.updateOne({ _id: userId }, { $unset: { googleRefreshToken: 1 } });
      throw new GoogleReauthError();
    }
    throw new Error(`Google token refresh failed (${resp.status})`);
  }
  const { access_token, expires_in } = await resp.json();
  cacheAccessToken(userId, access_token, expires_in);
  return access_token;
}

// Calls the Google Calendar API as the given user. Returns the fetch Response.
async function calendarFetch(userId, path, options = {}) {
  const token = await getAccessToken(userId);
  const resp = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body && { 'Content-Type': 'application/json' }),
    },
  });
  if (resp.status === 401) {
    accessTokens.delete(userId);
    throw new GoogleReauthError();
  }
  return resp;
}

module.exports = {
  exchangeCode,
  fetchProfile,
  cacheAccessToken,
  calendarFetch,
  encryptRefreshToken: encrypt,
  GoogleReauthError,
};
