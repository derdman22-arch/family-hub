const mongoose = require('mongoose');

const userRefSchema = {
  userId:   String,
  username: String,
};

const noteSchema = new mongoose.Schema(
  {
    id:          String,
    text:        { type: String, required: true },
    priority:    { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    dueDate:     { type: Date, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: userRefSchema, default: null },
    createdBy:   { type: userRefSchema, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
