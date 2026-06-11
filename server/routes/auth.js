const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();


// POST /api/auth/google
// Verifies the Google access_token, looks up the user by email in MongoDB,
// and returns a signed JWT. Only emails already in the collection are allowed.
router.post('/google', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: 'access_token required' });
  }

  let profile;
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!resp.ok) return res.status(401).json({ error: 'Invalid Google token' });
    profile = await resp.json();
  } catch {
    return res.status(500).json({ error: 'Failed to verify Google token' });
  }

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
