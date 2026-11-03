import { saveSession } from './api';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const STATE_KEY = 'fh_oauth_state';
const SCOPES = 'openid email profile https://www.googleapis.com/auth/calendar.events';

function redirectUri() {
  return `${window.location.origin}/auth/callback`;
}

// Full-page redirect to Google rather than a popup: popups don't work reliably in
// an iPhone home-screen app. `consent` forces Google to issue a refresh token.
export function startGoogleSignIn(prompt = 'select_account') {
  const state = crypto.randomUUID();
  localStorage.setItem(STATE_KEY, state);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt,
    state,
  });
  window.location.assign(url);
}

// Handles Google's redirect back to /auth/callback. Resolves to the saved
// session, or throws with a message to show on the sign-in screen.
export async function completeGoogleSignIn(search) {
  const params = new URLSearchParams(search);
  const expectedState = localStorage.getItem(STATE_KEY);
  localStorage.removeItem(STATE_KEY);

  if (params.get('error')) throw new Error('Google sign-in was cancelled.');
  if (!params.get('code') || !expectedState || params.get('state') !== expectedState) {
    throw new Error('Sign-in could not be verified. Please try again.');
  }

  const resp = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: params.get('code'), redirect_uri: redirectUri() }),
  });
  if (resp.status === 403) throw new Error('This Google account is not authorized to use Family Hub.');
  if (!resp.ok) throw new Error("Couldn't verify your account with the server. Please try again.");

  const data = await resp.json();
  if (data.needsConsent) {
    startGoogleSignIn('consent');
    return null;
  }
  if (!data.token) throw new Error('The server did not return a session.');

  const session = { token: data.token, user: data.user };
  saveSession(session);
  return session;
}
