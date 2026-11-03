const express = require('express');
const { getRecommendations, search } = require('../controllers/musicController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/recommendations', protect, getRecommendations);
router.get('/search', protect, search);

module.exports = router;
