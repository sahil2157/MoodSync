const asyncHandler = require('express-async-handler');
const Journal = require('../models/Journal');
const Mood = require('../models/Mood');
const { classifyEmotion } = require('../services/emotionService');

// @desc    Create a journal entry (auto-analyzed for emotion)
// @route   POST /api/journal
// @access  Private
const createJournal = asyncHandler(async (req, res) => {
  const { title, text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Journal text is required');
  }

  const result = await classifyEmotion(text);

  const mood = await Mood.create({
    user: req.user._id,
    inputText: text,
    emotion: result.emotion,
    confidence: result.confidence,
    intensity: result.intensity,
    interpretation: result.interpretation,
    source: 'journal',
  });

  const journal = await Journal.create({
    user: req.user._id,
    title: title || '',
    text,
    emotion: result.emotion,
    confidence: result.confidence,
    intensity: result.intensity,
    mood: mood._id,
  });

  res.status(201).json({ success: true, journal, mood });
});

// @desc    Get journal entries for the logged-in user
// @route   GET /api/journal
// @access  Private
const getJournals = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 200);
  const journals = await Journal.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, count: journals.length, journals });
});

// @desc    Delete a journal entry
// @route   DELETE /api/journal/:id
// @access  Private
const deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({ _id: req.params.id, user: req.user._id });
  if (!journal) {
    res.status(404);
    throw new Error('Journal entry not found');
  }
  await journal.deleteOne();
  res.json({ success: true, message: 'Journal entry deleted' });
});

module.exports = { createJournal, getJournals, deleteJournal };
