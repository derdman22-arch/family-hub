const mongoose = require('mongoose');

// One shared grocery list for the whole family
const groceryItemSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true, maxlength: 200 },
    checked:   { type: Boolean, default: false },
    addedBy:   String, // userId
    checkedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroceryItem', groceryItemSchema);
