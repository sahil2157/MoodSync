const mongoose = require('mongoose');
const { EMOTIONS, INTENSITIES } = require('../config/constants');

const moodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inputText: { type: String, required: true, trim: true, maxlength: 2000 },
    emotion: { type: String, enum: EMOTIONS, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    intensity: { type: String, enum: INTENSITIES, required: true },
    interpretation: { type: String, required: true },
    source: { type: String, enum: ['mood_check', 'journal', 'chat', 'quick_button'], default: 'mood_check' },
  },
  { timestamps: true }
);

moodSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Mood', moodSchema);
