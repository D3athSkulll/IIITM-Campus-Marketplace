const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadImage } = require('../controllers/uploadController');

// POST /api/upload — authenticated users only; max 10MB JSON (set in index.js)
router.post('/', auth, uploadImage);

module.exports = router;
