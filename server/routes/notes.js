const express = require('express');
const { randomUUID } = require('crypto');
const Note = require('../models/Note');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { notifyOthers } = require('../lib/push');

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
    obj.assignedTo = obj.assignedTo || obj.createdBy?.userId || null;
    const cb = obj.createdBy?.userId && byId[obj.createdBy.userId];
    if (cb) obj.createdBy = { ...obj.createdBy, name: cb.name, picture: cb.picture };
    const done = obj.completedBy?.userId && byId[obj.completedBy.userId];
    if (done) obj.completedBy = { ...obj.completedBy, name: done.name, picture: done.picture };
    return obj;
  });
}

function firstName(name, fallback) {
  return (name || fallback || 'Someone').split(' ')[0];
}

async function validAssignee(userId) {
  if (!userId) return null;
  return (await User.exists({ _id: userId })) ? String(userId) : undefined;
}

router.get('/', async (req, res) => {
  try {
    // Completed to-dos older than 30 days drop off the list
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const notes = await Note.find({ $or: [{ completedAt: null }, { completedAt: { $gte: cutoff } }] })
      .sort({ createdAt: -1 });
    res.json(await enrichWithUsers(notes));
  } catch {
    res.status(500).json({ error: 'Failed to fetch to-dos' });
  }
});

router.post('/', async (req, res) => {
  const { text, assignedTo } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text required' });
  }
  try {
    const assignee = (await validAssignee(assignedTo)) ?? req.user.userId;
    const note = await Note.create({
      id: randomUUID(),
      text,
      assignedTo: assignee,
      createdBy: { userId: req.user.userId, username: req.user.email },
    });
    const [enriched] = await enrichWithUsers([note]);
    res.status(201).json(enriched);

    const who = firstName(enriched.createdBy.name, req.user.email);
    const forYou = assignee !== req.user.userId;
    notifyOthers(req.user.userId, {
      title: forYou ? `${who} added a to-do for you` : `${who} added a to-do`,
      body: note.text,
    });
  } catch (err) {
    console.error('Create note error:', err.message);
    res.status(500).json({ error: 'Failed to create to-do' });
  }
});

router.patch('/:id', async (req, res) => {
  const { completed, text, assignedTo } = req.body;
  const patch = {};
  if (completed === true) {
    patch.completedAt = new Date();
    patch.completedBy = { userId: req.user.userId, username: req.user.email };
  } else if (completed === false) {
    patch.completedAt = null;
    patch.completedBy = null;
  }
  if (typeof text === 'string' && text.trim()) patch.text = text;

  try {
    if (assignedTo !== undefined) {
      const assignee = await validAssignee(assignedTo);
      if (!assignee) return res.status(400).json({ error: 'Unknown assignee' });
      patch.assignedTo = assignee;
    }
    const before = await Note.findByIdAndUpdate(req.params.id, patch);
    if (!before) return res.status(404).json({ error: 'To-do not found' });
    const note = await Note.findById(req.params.id);
    const [enriched] = await enrichWithUsers([note]);
    res.json(enriched);

    if (completed === true && !before.completedAt) {
      const user = await User.findById(req.user.userId, 'name');
      notifyOthers(req.user.userId, {
        title: `${firstName(user?.name, req.user.email)} completed a to-do`,
        body: `✓ ${note.text}`,
      });
    }
  } catch {
    res.status(500).json({ error: 'Failed to update to-do' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: 'To-do not found' });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete to-do' });
  }
});

module.exports = router;
