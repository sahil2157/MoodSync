const express = require('express');
const { listGames, getGameAssets, saveSession, getHistory } = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listGames);
router.get('/assets/:type', protect, getGameAssets);
router.post('/session', protect, saveSession);
router.get('/history', protect, getHistory);

module.exports = router;
