const express = require('express');
const { sendMessage, getHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/history', protect, getHistory);

module.exports = router;
