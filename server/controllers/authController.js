const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Parses the ADMIN_EMAILS env var ("a@x.com,b@y.com") into a lowercase Set,
// so new registrations matching one of these addresses are auto-promoted
// to admin. This gives you a way to bootstrap your first admin account
// without touching the database directly — just add your email to
// server/.env before registering.
function getAdminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const role = getAdminEmailSet().has(email.toLowerCase()) ? 'admin' : 'user';
  const user = await User.create({ name, email, password, role });
  const token = generateToken(user._id);

  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been disabled. Please contact an administrator.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update profile / preferences
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, preferences, avatarColor } = req.body;

  if (name) req.user.name = name;
  if (avatarColor) req.user.avatarColor = avatarColor;
  if (preferences) {
    req.user.preferences = { ...req.user.preferences.toObject(), ...preferences };
  }

  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe, updateMe };
