const mongoose = require('mongoose');
const { COUNSELLOR_PERSONALITIES } = require('../config/constants');

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personality: { type: String, enum: COUNSELLOR_PERSONALITIES, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, trim: true, maxlength: 8000 },
    detectedEmotion: { type: String },
    language: { type: String, maxlength: 10 },
    flaggedCrisis: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
