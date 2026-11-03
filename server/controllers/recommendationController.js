const asyncHandler = require('express-async-handler');
const Mood = require('../models/Mood');
const GameSession = require('../models/GameSession');
const Recommendation = require('../models/Recommendation');
const { getRecommendations } = require('../services/recommendationService');

// @desc    Get personalized recommendations based on mood history, preferences, etc.
// @route   GET /api/recommendations
// @access  Private
const getMyRecommendations = asyncHandler(async (req, res) => {
  const latestMood = await Mood.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  const mood = latestMood?.emotion || 'neutral';
  const intensity = latestMood?.intensity || 'medium';

  const recentMoodsDocs = await Mood.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5);
  const recentMoods = recentMoodsDocs.map((m) => m.emotion);

  const recentSessions = await GameSession.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(3);
  const previousActivities = recentSessions.map((s) => s.gameType);

  const bundle = getRecommendations({
    mood,
    intensity,
    recentMoods,
    previousActivities,
    personality: req.user.preferences?.defaultCounsellorPersonality,
  });

  const record = await Recommendation.create({
    user: req.user._id,
    mood: bundle.mood,
    intensity: bundle.intensity,
    musicCategory: bundle.musicCategory,
    game: bundle.game,
    quoteCategory: bundle.quoteCategory,
    activity: bundle.activity,
  });

  res.json({ success: true, recommendation: record, bundle });
});

// @desc    Submit feedback on a recommendation
// @route   PUT /api/recommendations/:id/feedback
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { feedback } = req.body;
  if (!['helpful', 'not_helpful'].includes(feedback)) {
    res.status(400);
    throw new Error('Feedback must be "helpful" or "not_helpful"');
  }
  const rec = await Recommendation.findOne({ _id: req.params.id, user: req.user._id });
  if (!rec) {
    res.status(404);
    throw new Error('Recommendation not found');
  }
  rec.feedback = feedback;
  await rec.save();
  res.json({ success: true, recommendation: rec });
});

module.exports = { getMyRecommendations, submitFeedback };
