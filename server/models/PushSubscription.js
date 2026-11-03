const mongoose = require('mongoose');

// A device that has turned on notifications. One user can have several.
const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId:   { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
