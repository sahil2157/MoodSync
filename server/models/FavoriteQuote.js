const mongoose = require('mongoose');

const favoriteQuoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
    author: { type: String, default: 'Unknown' },
    category: { type: String, default: 'motivation' },
  },
  { timestamps: true }
);

favoriteQuoteSchema.index({ user: 1, text: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteQuote', favoriteQuoteSchema);
