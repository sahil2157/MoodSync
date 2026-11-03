const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const Mood = require('../models/Mood');
const Journal = require('../models/Journal');
const Goal = require('../models/Goal');
const FavoriteQuote = require('../models/FavoriteQuote');
const GameSession = require('../models/GameSession');
const Recommendation = require('../models/Recommendation');
const ChatMessage = require('../models/ChatMessage');

// @desc    List users with search, role filter, and pagination, plus a
//          lightweight activity count (mood check-ins) per user so the
//          admin can see who's actually using the platform.
// @route   GET /api/admin/users?search=&role=&page=&limit=
// @access  Private/Admin
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { search, role } = req.query;

  const filter = {};
  if (search && search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (role && ['user', 'admin'].includes(role)) {
    filter.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  // Attach a simple activity count (mood check-ins) per user in one query
  const userIds = users.map((u) => u._id);
  const moodCounts = await Mood.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(moodCounts.map((m) => [String(m._id), m.count]));

  const results = users.map((u) => ({
    ...u.toSafeObject(),
    moodCheckIns: countMap[String(u._id)] || 0,
  }));

  res.json({
    success: true,
    users: results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @desc    Get a single user's profile plus an activity summary
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid user id');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const [moodCount, journalCount, goalCount, gameSessionCount] = await Promise.all([
    Mood.countDocuments({ user: user._id }),
    Journal.countDocuments({ user: user._id }),
    Goal.countDocuments({ user: user._id }),
    GameSession.countDocuments({ user: user._id }),
  ]);

  res.json({
    success: true,
    user: user.toSafeObject(),
    activity: { moodCount, journalCount, goalCount, gameSessionCount },
  });
});

// @desc    Update a user's role, active status, or name (admin action)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid user id');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Safeguard: an admin cannot change their own role or deactivate their
  // own account here — this prevents an admin from accidentally locking
  // themselves out with no other way back in. Use a different admin
  // account, or the promoteAdmin script, to manage the account you're
  // currently signed in as.
  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You can't change your own role or active status. Use another admin account.");
  }

  const { role, isActive, name } = req.body;
  if (role !== undefined) {
    if (!['user', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Role must be "user" or "admin"');
    }
    user.role = role;
  }
  if (isActive !== undefined) user.isActive = !!isActive;
  if (name !== undefined && name.trim()) user.name = name.trim();

  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Delete a user and cascade-delete all of their data
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid user id');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You can't delete your own account from the admin panel.");
  }

  // Clean up everything this user owns so no orphaned documents remain.
  await Promise.all([
    Mood.deleteMany({ user: user._id }),
    Journal.deleteMany({ user: user._id }),
    Goal.deleteMany({ user: user._id }),
    FavoriteQuote.deleteMany({ user: user._id }),
    GameSession.deleteMany({ user: user._id }),
    Recommendation.deleteMany({ user: user._id }),
    ChatMessage.deleteMany({ user: user._id }),
  ]);
  await user.deleteOne();

  res.json({ success: true, message: 'User and all associated data deleted' });
});

// @desc    Platform-wide stats for the admin dashboard header
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUsers, adminCount, newUsersLast7Days, totalMoodCheckIns] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Mood.countDocuments({}),
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      disabledUsers: totalUsers - activeUsers,
      adminCount,
      newUsersLast7Days,
      totalMoodCheckIns,
    },
  });
});

module.exports = { listUsers, getUser, updateUser, deleteUser, getStats };
