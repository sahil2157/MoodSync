const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');

// @desc    Create goal
// @route   POST /api/goals
// @access  Private
const createGoal = asyncHandler(async (req, res) => {
  const { title, category, targetDate } = req.body;
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('Goal title is required');
  }
  const goal = await Goal.create({ user: req.user._id, title, category, targetDate });
  res.status(201).json({ success: true, goal });
});

// @desc    Get all goals for user
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ completed: 1, createdAt: -1 });
  res.json({ success: true, count: goals.length, goals });
});

// @desc    Update a goal (title/category/completed)
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  const { title, category, completed, targetDate } = req.body;
  if (title !== undefined) goal.title = title;
  if (category !== undefined) goal.category = category;
  if (targetDate !== undefined) goal.targetDate = targetDate;
  if (completed !== undefined) {
    goal.completed = completed;
    goal.completedAt = completed ? new Date() : null;
  }

  await goal.save();
  res.json({ success: true, goal });
});

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  await goal.deleteOne();
  res.json({ success: true, message: 'Goal deleted' });
});

module.exports = { createGoal, getGoals, updateGoal, deleteGoal };
