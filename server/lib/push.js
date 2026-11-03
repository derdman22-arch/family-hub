const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Note = require('../models/Note');
const User = require('../models/User');

const enabled = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

if (enabled) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys not set — push notifications are disabled');
}

// Sends a notification about a to-do to every family member except the one who
// made the change. Each payload carries that person's open to-do count for the
// home-screen badge. Never throws: a failed push must not fail the request.
async function notifyOthers(actorId, { title, body }) {
  if (!enabled) return;
  try {
    const others = await User.find({ _id: { $ne: actorId } }, '_id');
    await Promise.all(others.map(async ({ _id }) => {
      const userId = _id.toString();
      const subs = await PushSubscription.find({ userId });
      if (subs.length === 0) return;
      const badge = await Note.countDocuments(Note.openFor(userId));
      const payload = JSON.stringify({ title, body, badge, url: '/' });

      await Promise.all(subs.map((sub) =>
        webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
          .catch(async (err) => {
            // 404/410: the device unsubscribed or the app was removed
            if (err.statusCode === 404 || err.statusCode === 410) {
              await PushSubscription.deleteOne({ _id: sub._id });
            } else {
              console.error('Push failed:', err.statusCode, err.body);
            }
          })
      ));
    }));
  } catch (err) {
    console.error('notifyOthers error:', err.message);
  }
}

module.exports = { notifyOthers, enabled };
