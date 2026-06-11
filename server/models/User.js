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
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
