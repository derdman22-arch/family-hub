const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT, then confirms the user is still in the collection so that
// removing someone from the list cuts off their existing sessions immediately.
module.exports = async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await User.findById(payload.userId, 'email role');
    if (!user) return res.status(401).json({ error: 'Account no longer authorized' });
    req.user = { userId: user._id.toString(), email: user.email, role: user.role };
    next();
  } catch {
    res.status(500).json({ error: 'Failed to verify account' });
  }
};
