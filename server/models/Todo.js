const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    text:        { type: String, required: true },
    note:        { type: String, default: '' },
    priority:    { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    completed:   { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: {
      name:     String,
      initials: String,
    },
    createdBy: {
      name:     { type: String, required: true },
      initials: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Todo', todoSchema);
