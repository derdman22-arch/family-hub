const express = require('express');
const { randomUUID } = require('crypto');
const Note = require('../models/Note');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

async function enrichWithUsers(notes) {
  const ids = [...new Set(
    notes.flatMap((n) => [n.createdBy?.userId, n.completedBy?.userId].filter(Boolean))
  )];
  const users = await User.find({ _id: { $in: ids } }, 'name email picture');
  const byId = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  return notes.map((n) => {
    const obj = n.toObject();
    const cb = obj.createdBy?.userId && byId[obj.createdBy.userId];
    if (cb) obj.createdBy = { ...obj.createdBy, name: cb.name, picture: cb.picture };
    const done = obj.completedBy?.userId && byId[obj.completedBy.userId];
    if (done) obj.completedBy = { ...obj.completedBy, name: done.name, picture: done.picture };
    return obj;
  });
}

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(await enrichWithUsers(notes));
  } catch {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', async (req, res) => {
  const { text, priority, dueDate } = req.body;
  try {
    const note = await Note.create({
      id: randomUUID(),
      text,
      priority,
      ...(dueDate && { dueDate: new Date(dueDate) }),
      createdBy: { userId: req.user.userId, username: req.user.email },
    });
    const [enriched] = await enrichWithUsers([note]);
    res.status(201).json(enriched);
  } catch (err) {
    console.error('Create note error:', err.message);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.patch('/:id', async (req, res) => {
  const { completed } = req.body;
  const patch = completed
    ? {
        completedAt: new Date(),
        completedBy: { userId: req.user.userId, username: req.user.email },
      }
    : { completedAt: null, completedBy: null };

  try {
    const note = await Note.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    const [enriched] = await enrichWithUsers([note]);
    res.json(enriched);
  } catch {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

module.exports = router;
