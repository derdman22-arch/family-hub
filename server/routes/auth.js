const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { exchangeCode, fetchProfile, cacheAccessToken, encryptRefreshToken } = require('../lib/google');

const router = express.Router();

// The frontend sends the user to Google and Google redirects back to
// <origin>/auth/callback. Only our own origins may be used, otherwise a code
// obtained elsewhere could be replayed here.
function allowedRedirectUris() {
  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',');
  return origins.map((o) => `${o.trim().replace(/\/$/, '')}/auth/callback`);
}

// POST /api/auth/google  { code, redirect_uri }
// Exchanges the Google authorization code (server-side, with the client secret),
// checks the email against the users collection, stores the refresh token and
// returns a signed JWT. Only emails already in the collection are allowed.
router.post('/google', async (req, res) => {
  const { code, redirect_uri } = req.body;
  if (typeof code !== 'string' || !code) {
    return res.status(400).json({ error: 'code required' });
  }
  if (!allowedRedirectUris().includes(redirect_uri)) {
    return res.status(400).json({ error: 'redirect_uri not allowed' });
  }

  let tokens, profile;
  try {
    tokens = await exchangeCode(code, redirect_uri);
    if (tokens) profile = await fetchProfile(tokens.access_token);
  } catch {
    return res.status(500).json({ error: 'Failed to verify with Google' });
  }
  if (!profile) return res.status(401).json({ error: 'Invalid Google sign-in' });

  let user;
  try {
    user = await User.findOne({ email: profile.email.toLowerCase() }).select('+googleRefreshToken');
    if (!user) {
      return res.status(403).json({ error: 'Access denied — email not registered' });
    }

    // Google only returns a refresh token when the user sees the consent screen.
    // If we don't have one yet, ask the frontend to go through consent.
    if (!tokens.refresh_token && !user.googleRefreshToken) {
      return res.json({ needsConsent: true });
    }

    user.googleId = profile.sub;
    user.name = profile.name;
    user.picture = profile.picture;
    user.lastLogin = new Date();
    if (tokens.refresh_token) user.googleRefreshToken = encryptRefreshToken(tokens.refresh_token);
    await user.save();
  } catch (err) {
    console.error('Sign-in error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }

  cacheAccessToken(user._id.toString(), tokens.access_token, tokens.expires_in);

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '60d' }
  );

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, picture: user.picture },
  });
});

module.exports = router;
