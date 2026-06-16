const express = require('express');
const Todo = require('../models/Todo');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

router.post('/', async (req, res) => {
  const { text, note, priority, createdBy } = req.body;
  try {
    const todo = await Todo.create({ text, note, priority, createdBy });
    res.status(201).json(todo);
  } catch {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  } catch {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

module.exports = router;
