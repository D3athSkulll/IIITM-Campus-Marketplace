const Comment = require('../models/Comment');
const User = require('../models/User');
const Listing = require('../models/Listing');

/**
 * GET /api/listings/:id/comments
 * Fetch all comments for a listing (newest first, paginated)
 */
const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ listing: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock')
        .populate('mentions', 'displayName anonymousNickname realName showRealIdentity'),
      Comment.countDocuments({ listing: req.params.id }),
    ]);

    res.json({ comments, total, page: Number(page), hasMore: skip + comments.length < total });
  } catch (error) {
    console.error('getComments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
};

/**
 * POST /api/listings/:id/comments
 * Post a new comment on a listing.
 * Parses @nickname mentions in the content and resolves them to user IDs.
 */
const postComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required.' });
    }
    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Comment cannot exceed 500 characters.' });
    }

    const listing = await Listing.findById(req.params.id).select('_id status');
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    // Parse @mentions: match @word (alphanumeric + hyphens + underscores)
    const mentionPattern = /@([\w-]+)/g;
    const rawMentions = [...content.matchAll(mentionPattern)].map((m) => m[1]);

    let mentionIds = [];
    if (rawMentions.length > 0) {
      // Find users by anonymousNickname (case-insensitive) or realName (only if they show real identity)
      const users = await User.find({
        $or: [
          { anonymousNickname: { $in: rawMentions.map((m) => new RegExp(`^${m}$`, 'i')) } },
        ],
      }).select('_id anonymousNickname');
      mentionIds = users.map((u) => u._id);
    }

    const comment = await Comment.create({
      listing: req.params.id,
      author: req.user._id,
      content: content.trim(),
      mentions: mentionIds,
    });

    await comment.populate('author', 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock');
    await comment.populate('mentions', 'displayName anonymousNickname realName showRealIdentity');

    res.status(201).json({ comment });
  } catch (error) {
    console.error('postComment error:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
};

/**
 * DELETE /api/listings/:id/comments/:commentId
 * Delete a comment (author or admin only)
 */
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      listing: req.params.id,
    });

    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own comments.' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    console.error('deleteComment error:', error);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
};

/**
 * GET /api/users/search?q=
 * Search users by anonymousNickname for @mention autocomplete.
 * Returns minimal public info only.
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ users: [] });
    }

    const pattern = new RegExp(q.trim(), 'i');
    const users = await User.find({
      $or: [
        { anonymousNickname: pattern },
        { realName: pattern },
        { displayName: pattern },
      ],
    })
      .select('_id anonymousNickname displayName realName avatarUrl showRealIdentity')
      .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ error: 'Failed to search users.' });
  }
};

module.exports = { getComments, postComment, deleteComment, searchUsers };
