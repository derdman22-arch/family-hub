const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/users — family members, for showing and assigning to-do lists
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, 'name email picture').sort({ createdAt: 1 });
    res.json(users.map((u) => ({ id: u._id, name: u.name || u.email, email: u.email, picture: u.picture })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
