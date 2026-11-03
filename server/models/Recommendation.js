const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mood: { type: String, required: true },
    intensity: { type: String, required: true },
    musicCategory: { type: String },
    game: { type: String },
    quoteCategory: { type: String },
    activity: { type: String },
    feedback: { type: String, enum: ['helpful', 'not_helpful', null], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
