const mongoose = require('mongoose');
const { QUOTE_CATEGORIES } = require('../config/constants');

const quoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    author: { type: String, trim: true, default: 'Unknown' },
    category: { type: String, enum: QUOTE_CATEGORIES, default: 'motivation' },
    source: { type: String, enum: ['api', 'local'], default: 'local' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quote', quoteSchema);
