const asyncHandler = require('express-async-handler');
const ChatMessage = require('../models/ChatMessage');
const { generateReply } = require('../services/chatService');
const { classifyLocally } = require('../services/emotionService');
const { COUNSELLOR_PERSONALITIES } = require('../config/constants');

// @desc    Send a message to the AI counsellor and get a reply
// @route   POST /api/chat
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { message, personality, uiLanguage } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Message is required');
  }
  const selectedPersonality = COUNSELLOR_PERSONALITIES.includes(personality) ? personality : 'warm_empathetic';

  // Quick local hint about the emotion in THIS message. The OpenAI counsellor
  // reads the message in any language and returns its own (better) emotion
  // label in the same single API call, so chat costs one request, not two.
  const liveMood = classifyLocally(message);
  const history = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);

  const userMsg = await ChatMessage.create({
    user: req.user._id,
    personality: selectedPersonality,
    role: 'user',
    content: message,
    detectedEmotion: liveMood?.emotion,
  });

  const { reply, flaggedCrisis, emotion, language } = await generateReply({
    personality: selectedPersonality,
    message,
    mood: liveMood?.emotion,
    uiLanguage: typeof uiLanguage === 'string' ? uiLanguage.slice(0, 10) : 'en',
    history: history.reverse().map((m) => ({ role: m.role, content: m.content })),
  });

  userMsg.detectedEmotion = emotion || userMsg.detectedEmotion;
  if (language) userMsg.language = language;
  if (flaggedCrisis) userMsg.flaggedCrisis = true;
  await userMsg.save();

  const assistantMsg = await ChatMessage.create({
    user: req.user._id,
    personality: selectedPersonality,
    role: 'assistant',
    content: reply,
    flaggedCrisis,
    language,
  });

  res.status(201).json({ success: true, userMessage: userMsg, assistantMessage: assistantMsg, flaggedCrisis });
});

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const messages = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).limit(limit);
  res.json({ success: true, count: messages.length, messages });
});

module.exports = { sendMessage, getHistory };
