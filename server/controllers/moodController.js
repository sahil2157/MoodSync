const asyncHandler = require('express-async-handler');
const Mood = require('../models/Mood');
const { classifyEmotion } = require('../services/emotionService');
const { EMOTIONS } = require('../config/constants');

// @desc    Analyze text and store a mood check-in
// @route   POST /api/mood/analyze
// @access  Private
const analyzeMood = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Please describe how you are feeling');
  }

  const result = await classifyEmotion(text);

  const mood = await Mood.create({
    user: req.user._id,
    inputText: text,
    emotion: result.emotion,
    confidence: result.confidence,
    intensity: result.intensity,
    interpretation: result.interpretation,
    source: 'mood_check',
  });

  res.status(201).json({ success: true, mood });
});

// @desc    Get mood history for the logged-in user
// @route   GET /api/mood/history
// @access  Private
const getMoodHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 200);
  const moods = await Mood.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, count: moods.length, moods });
});

// @desc    Get the most recent mood entry
// @route   GET /api/mood/latest
// @access  Private
const getLatestMood = asyncHandler(async (req, res) => {
  const mood = await Mood.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, mood: mood || null });
});

// @desc    One-tap mood (emoji buttons on the dashboard, no typing needed)
// @route   POST /api/mood/quick
// @access  Private
const quickMood = asyncHandler(async (req, res) => {
  const { emotion } = req.body;
  if (!EMOTIONS.includes(emotion)) {
    res.status(400);
    throw new Error('Please pick a valid mood');
  }
  const mood = await Mood.create({
    user: req.user._id,
    inputText: `[quick] ${emotion}`,
    emotion,
    confidence: 1,
    intensity: 'medium',
    interpretation: `You told us you are feeling ${emotion}. This is an informational reflection, not a medical or clinical diagnosis.`,
    source: 'quick_button',
  });
  res.status(201).json({ success: true, mood });
});

module.exports = { analyzeMood, quickMood, getMoodHistory, getLatestMood };
