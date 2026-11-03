const express = require('express');
const {
  getRandomQuote, getQuoteForMood, favoriteQuote, getFavorites, removeFavorite,
} = require('../controllers/quoteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/random', getRandomQuote);
router.get('/mood/:mood', getQuoteForMood);
router.post('/favorite', protect, favoriteQuote);
router.get('/favorites', protect, getFavorites);
router.delete('/favorite/:id', protect, removeFavorite);

module.exports = router;
