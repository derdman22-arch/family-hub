const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, unique: true },
    role:      { type: String, enum: ['admin', 'member'], default: 'member' },
    // Populated on first Google sign-in
    googleId:  { type: String, sparse: true },
    name:      String,
    picture:   String,
    lastLogin: Date,
    // Encrypted (lib/tokenCrypto). Lets the server call Google Calendar without
    // the user signing in again every hour. Never sent to the client.
    googleRefreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
