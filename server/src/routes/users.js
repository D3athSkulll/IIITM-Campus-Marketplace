const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/optionalAuth');
const { searchUsers } = require('../controllers/commentController');

// GET /api/users/search?q= — @mention autocomplete
router.get('/search', optionalAuth, searchUsers);

module.exports = router;
