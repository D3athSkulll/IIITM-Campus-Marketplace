const express = require('express');
const router = express.Router({ mergeParams: true });
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const { getComments, postComment, deleteComment } = require('../controllers/commentController');

// GET /api/listings/:id/comments — anyone can read
router.get('/', optionalAuth, getComments);

// POST /api/listings/:id/comments — must be signed in
router.post('/', auth, postComment);

// DELETE /api/listings/:id/comments/:commentId — author or admin
router.delete('/:commentId', auth, deleteComment);

module.exports = router;
