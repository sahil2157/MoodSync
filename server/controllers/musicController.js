const asyncHandler = require('express-async-handler');
const { getMusicByMood, searchMusic } = require('../services/musicService');

// @desc    Get music recommendations by mood category
// @route   GET /api/music/recommendations?category=relax&mood=sad
// @access  Private
const getRecommendations = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const result = await getMusicByMood(category || 'chill');
  res.json({ success: true, ...result });
});

// @desc    Search music by keyword
// @route   GET /api/music/search?q=...
// @access  Private
const search = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400);
    throw new Error('Query parameter "q" is required');
  }
  const result = await searchMusic(q);
  res.json({ success: true, ...result });
});

module.exports = { getRecommendations, search };
