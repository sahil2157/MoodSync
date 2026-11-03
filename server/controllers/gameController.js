const asyncHandler = require('express-async-handler');
const GameSession = require('../models/GameSession');
const quizQuestions = require('../data/quizQuestions');
const wordList = require('../data/wordList');
const { GAME_TYPES } = require('../config/constants');

// @desc    List available games + metadata
// @route   GET /api/games
// @access  Private
const listGames = asyncHandler(async (req, res) => {
  const games = [
    { id: 'memory_match', name: 'Memory Match', description: 'Flip and match calming pairs of cards.', icon: '🧠' },
    { id: 'reaction_challenge', name: 'Reaction Challenge', description: 'Tap the target the instant it appears.', icon: '⚡' },
    { id: 'word_scramble', name: 'Word Scramble', description: 'Unscramble wellness-themed words.', icon: '🔤' },
    { id: 'quick_quiz', name: 'Quick Quiz', description: 'Fun, light general-knowledge questions.', icon: '❓' },
  ];

  const highScores = await GameSession.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$gameType', highScore: { $max: '$score' } } },
  ]);
  const highScoreMap = Object.fromEntries(highScores.map((h) => [h._id, h.highScore]));

  res.json({ success: true, games: games.map((g) => ({ ...g, highScore: highScoreMap[g.id] || 0 })) });
});

// @desc    Get game assets (quiz questions / scramble words) for a game type
// @route   GET /api/games/assets/:type
// @access  Private
const getGameAssets = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (type === 'quick_quiz') {
    const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 8);
    return res.json({ success: true, type, questions: shuffled });
  }
  if (type === 'word_scramble') {
    const shuffled = [...wordList].sort(() => Math.random() - 0.5).slice(0, 8);
    const scrambled = shuffled.map((word) => ({
      word,
      scrambled: word.split('').sort(() => Math.random() - 0.5).join(''),
    }));
    return res.json({ success: true, type, words: scrambled });
  }
  // memory_match and reaction_challenge are fully client-driven (no server assets needed)
  res.json({ success: true, type, message: 'This game runs entirely client-side.' });
});

// @desc    Save a completed game session
// @route   POST /api/games/session
// @access  Private
const saveSession = asyncHandler(async (req, res) => {
  const { gameType, score, durationSeconds, metadata } = req.body;
  if (!GAME_TYPES.includes(gameType)) {
    res.status(400);
    throw new Error('Invalid game type');
  }
  const session = await GameSession.create({
    user: req.user._id,
    gameType,
    score: Number(score) || 0,
    durationSeconds: Number(durationSeconds) || 0,
    metadata: metadata || {},
  });

  const highScoreAgg = await GameSession.find({ user: req.user._id, gameType }).sort({ score: -1 }).limit(1);
  const isNewHighScore = highScoreAgg.length > 0 && String(highScoreAgg[0]._id) === String(session._id);

  res.status(201).json({ success: true, session, isNewHighScore });
});

// @desc    Get session history (optionally by game type)
// @route   GET /api/games/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
  const { gameType } = req.query;
  const filter = { user: req.user._id };
  if (gameType) filter.gameType = gameType;
  const sessions = await GameSession.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, count: sessions.length, sessions });
});

module.exports = { listGames, getGameAssets, saveSession, getHistory };
