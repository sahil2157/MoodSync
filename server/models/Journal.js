const mongoose = require('mongoose');
const { EMOTIONS, INTENSITIES } = require('../config/constants');

const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    emotion: { type: String, enum: EMOTIONS, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    intensity: { type: String, enum: INTENSITIES, required: true },
    mood: { type: mongoose.Schema.Types.ObjectId, ref: 'Mood' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Journal', journalSchema);
