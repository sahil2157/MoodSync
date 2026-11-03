const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes: verifies JWT from Authorization: Bearer <token> header
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    if (!user.isActive) {
      res.status(403);
      throw new Error('This account has been disabled. Please contact an administrator.');
    }
    req.user = user;
    next();
  } catch (err) {
    // Re-throw errors we deliberately raised above (401/403) as-is instead
    // of masking them with a generic 401, so the disabled-account message
    // actually reaches the client.
    if (res.statusCode === 403 || res.statusCode === 401) throw err;
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

// Restrict a route to admin users only. Must run AFTER `protect`, since it
// relies on req.user already being set.
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  next();
};

module.exports = { protect, adminOnly };
