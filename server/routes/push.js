const express = require('express');
const PushSubscription = require('../models/PushSubscription');
const requireAuth = require('../middleware/auth');
const { enabled } = require('../lib/push');

const router = express.Router();

router.use(requireAuth);

// GET /api/push/key — the public VAPID key the browser needs to subscribe
router.get('/key', (req, res) => {
  if (!enabled) return res.status(503).json({ error: 'Push notifications are not configured' });
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe — body is the browser's PushSubscription JSON
router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  try {
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user.userId, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      { upsert: true }
    );
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    await PushSubscription.deleteOne({ endpoint: req.body?.endpoint, userId: req.user.userId });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

module.exports = router;
