const mongoose = require('mongoose');
const { GAME_TYPES } = require('../config/constants');

const gameSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gameType: { type: String, enum: GAME_TYPES, required: true },
    score: { type: Number, required: true, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

gameSessionSchema.index({ user: 1, gameType: 1, score: -1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);
