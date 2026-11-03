const express = require('express');
const { createJournal, getJournals, deleteJournal } = require('../controllers/journalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, createJournal).get(protect, getJournals);
router.delete('/:id', protect, deleteJournal);

module.exports = router;
