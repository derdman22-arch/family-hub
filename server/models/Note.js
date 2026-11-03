const mongoose = require('mongoose');

// A to-do. Kept as "Note" so the existing `notes` collection carries over.

const userRefSchema = {
  userId:   String,
  username: String,
};

const noteSchema = new mongoose.Schema(
  {
    id:          String,
    text:        { type: String, required: true, trim: true, maxlength: 500 },
    priority:    { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    dueDate:     { type: Date, default: null },
    // Whose list it's on. Older notes don't have it and belong to their creator.
    assignedTo:  { type: String, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: userRefSchema, default: null },
    createdBy:   { type: userRefSchema, required: true },
  },
  { timestamps: true }
);

// Query for a user's open to-dos, matching the "belongs to creator" fallback above
noteSchema.statics.openFor = function openFor(userId) {
  return {
    completedAt: null,
    $or: [{ assignedTo: userId }, { assignedTo: null, 'createdBy.userId': userId }],
  };
};

module.exports = mongoose.model('Note', noteSchema);
