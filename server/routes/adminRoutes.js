const express = require('express');
const { listUsers, getUser, updateUser, deleteUser, getStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a valid, active-user JWT AND an admin role.
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
