const express = require('express');
const { getMyRecommendations, submitFeedback } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getMyRecommendations);
router.put('/:id/feedback', protect, submitFeedback);

module.exports = router;
