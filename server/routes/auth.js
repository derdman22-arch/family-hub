const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Asks Google who a token belongs to AND which app it was issued to. Checking the
// audience matters: without it, a token minted for some other OAuth app by an
// allowed family member would be accepted here.
// Returns the Google profile, or null if the token isn't valid for this app.
async function verifyGoogleToken(accessToken) {
  const [infoResp, profileResp] = await Promise.all([
    fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`),
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);
  if (!infoResp.ok || !profileResp.ok) return null;

  const info = await infoResp.json();
  if (info.aud !== process.env.GOOGLE_CLIENT_ID) return null;

  const profile = await profileResp.json();
  if (typeof profile.email !== 'string' || profile.email_verified !== true) return null;
  return profile;
}

// POST /api/auth/google
// Verifies the Google access_token, looks up the user by email in MongoDB,
// and returns a signed JWT. Only emails already in the collection are allowed.
router.post('/google', async (req, res) => {
  const { access_token } = req.body;
  if (typeof access_token !== 'string' || !access_token) {
    return res.status(400).json({ error: 'access_token required' });
  }

  let profile;
  try {
    profile = await verifyGoogleToken(access_token);
  } catch {
    return res.status(500).json({ error: 'Failed to verify Google token' });
  }
  if (!profile) return res.status(401).json({ error: 'Invalid Google token' });

  let user;
  try {
    user = await User.findOneAndUpdate(
      { email: profile.email },
      {
        googleId:  profile.sub,
        name:      profile.name,
        picture:   profile.picture,
        lastLogin: new Date(),
      },
      { new: true }
    );
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (!user) {
    return res.status(403).json({ error: 'Access denied — email not registered' });
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { name: user.name, email: user.email, picture: user.picture, role: user.role },
  });
});

module.exports = router;
