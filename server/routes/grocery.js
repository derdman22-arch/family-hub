const express = require('express');
const GroceryItem = require('../models/GroceryItem');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    res.json(await GroceryItem.find().sort({ createdAt: 1 }));
  } catch {
    res.status(500).json({ error: 'Failed to fetch grocery list' });
  }
});

router.post('/', async (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text required' });
  }
  try {
    res.status(201).json(await GroceryItem.create({ text, addedBy: req.user.userId }));
  } catch {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

router.patch('/:id', async (req, res) => {
  const { checked, text } = req.body;
  const patch = {};
  if (typeof checked === 'boolean') {
    patch.checked = checked;
    patch.checkedAt = checked ? new Date() : null;
  }
  if (typeof text === 'string' && text.trim()) patch.text = text;
  try {
    const item = await GroceryItem.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/grocery/checked — clears everything that's been checked off
router.delete('/checked', async (req, res) => {
  try {
    await GroceryItem.deleteMany({ checked: true });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to clear items' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await GroceryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
