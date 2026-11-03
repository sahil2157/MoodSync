const asyncHandler = require('express-async-handler');
const FavoriteQuote = require('../models/FavoriteQuote');
const { getQuoteByMoodCategory, getRandomLocalQuote } = require('../services/quoteService');
const { QUOTE_CATEGORIES } = require('../config/constants');

// @desc    Get a random quote (optionally by category)
// @route   GET /api/quotes/random
// @access  Public
const getRandomQuote = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const quote = category && QUOTE_CATEGORIES.includes(category)
    ? await getQuoteByMoodCategory(category)
    : getRandomLocalQuote();
  res.json({ success: true, quote });
});

// @desc    Get a quote tailored to a mood
// @route   GET /api/quotes/mood/:mood
// @access  Public
const MOOD_TO_QUOTE_CATEGORY = {
  happy: 'positivity', sad: 'positivity', angry: 'stress relief', stressed: 'stress relief',
  anxious: 'self-belief', bored: 'motivation', tired: 'self-belief', calm: 'productivity',
  excited: 'success', neutral: 'motivation',
};

const getQuoteForMood = asyncHandler(async (req, res) => {
  const { mood } = req.params;
  const category = MOOD_TO_QUOTE_CATEGORY[mood] || 'motivation';
  const quote = await getQuoteByMoodCategory(category);
  res.json({ success: true, mood, category, quote });
});

// @desc    Save a quote to favorites
// @route   POST /api/quotes/favorite
// @access  Private
const favoriteQuote = asyncHandler(async (req, res) => {
  const { text, author, category } = req.body;
  if (!text) {
    res.status(400);
    throw new Error('Quote text is required');
  }
  try {
    const favorite = await FavoriteQuote.create({ user: req.user._id, text, author, category });
    res.status(201).json({ success: true, favorite });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      throw new Error('You already saved this quote');
    }
    throw err;
  }
});

// @desc    Get favorite quotes
// @route   GET /api/quotes/favorites
// @access  Private
const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await FavoriteQuote.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: favorites.length, favorites });
});

// @desc    Remove a favorite quote
// @route   DELETE /api/quotes/favorite/:id
// @access  Private
const removeFavorite = asyncHandler(async (req, res) => {
  const favorite = await FavoriteQuote.findOne({ _id: req.params.id, user: req.user._id });
  if (!favorite) {
    res.status(404);
    throw new Error('Favorite not found');
  }
  await favorite.deleteOne();
  res.json({ success: true, message: 'Removed from favorites' });
});

module.exports = { getRandomQuote, getQuoteForMood, favoriteQuote, getFavorites, removeFavorite };
