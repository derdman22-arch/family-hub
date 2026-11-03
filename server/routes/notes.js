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

// Due dates are calendar days ("YYYY-MM-DD"). Stored at noon UTC so the day
// doesn't shift in any US timezone. Returns undefined for invalid input.
function parseDueDate(value) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatDue(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
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

// GET /api/notes/stats — completions from the last 90 days plus all-time
// counts per person. The client buckets them by day in its own timezone.
router.get('/stats', async (req, res) => {
  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [recent, totals] = await Promise.all([
      Note.find({ completedAt: { $gte: since } }, 'completedAt completedBy.userId createdAt dueDate').lean(),
      Note.aggregate([
        { $match: { completedAt: { $ne: null } } },
        { $group: { _id: '$completedBy.userId', count: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      completions: recent.map((n) => ({
        completedAt: n.completedAt,
        completedBy: n.completedBy?.userId || null,
        createdAt: n.createdAt,
        dueDate: n.dueDate || null,
      })),
      totals: Object.fromEntries(totals.filter((t) => t._id).map((t) => [t._id, t.count])),
    });
  } catch {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.post('/', async (req, res) => {
  const { text, assignedTo } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text required' });
  }
  const dueDate = parseDueDate(req.body.dueDate ?? null);
  if (dueDate === undefined) return res.status(400).json({ error: 'Invalid due date' });
  try {
    const assignee = (await validAssignee(assignedTo)) ?? req.user.userId;
    const note = await Note.create({
      id: randomUUID(),
      text,
      assignedTo: assignee,
      dueDate,
      createdBy: { userId: req.user.userId, username: req.user.email },
    });
    const [enriched] = await enrichWithUsers([note]);
    res.status(201).json(enriched);

    const who = firstName(enriched.createdBy.name, req.user.email);
    const forYou = assignee !== req.user.userId;
    notifyOthers(req.user.userId, {
      title: forYou ? `${who} added a to-do for you` : `${who} added a to-do`,
      body: dueDate ? `${note.text} · due ${formatDue(dueDate)}` : note.text,
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
  if (req.body.dueDate !== undefined) {
    const dueDate = parseDueDate(req.body.dueDate);
    if (dueDate === undefined) return res.status(400).json({ error: 'Invalid due date' });
    patch.dueDate = dueDate;
  }

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
