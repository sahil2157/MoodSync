const express = require('express');
const { createGoal, getGoals, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, createGoal).get(protect, getGoals);
router.route('/:id').put(protect, updateGoal).delete(protect, deleteGoal);

module.exports = router;
