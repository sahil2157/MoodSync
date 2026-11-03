const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    category: {
      type: String,
      enum: ['health', 'study', 'mindfulness', 'productivity', 'social', 'other'],
      default: 'other',
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    targetDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
