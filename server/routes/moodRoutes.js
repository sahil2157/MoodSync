const express = require('express');
const { analyzeMood, quickMood, getMoodHistory, getLatestMood } = require('../controllers/moodController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/analyze', protect, analyzeMood);
router.post('/quick', protect, quickMood);
router.get('/history', protect, getMoodHistory);
router.get('/latest', protect, getLatestMood);

module.exports = router;
