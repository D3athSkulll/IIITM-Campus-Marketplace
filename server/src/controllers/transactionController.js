const Transaction = require('../models/Transaction');
const Rating = require('../models/Rating');
const Chat = require('../models/Chat');

/**
 * POST /api/transactions
 * Create a transaction from an accepted negotiation
 */
const createTransaction = async (req, res) => {
  try {
    const { chatId, paymentMethod = 'cash' } = req.body;
    if (!chatId) return res.status(400).json({ error: 'chatId is required.' });

    const chat = await Chat.findById(chatId).populate('listing');
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (chat.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can create a transaction.' });
    }

    if (!chat.negotiation || chat.negotiation.outcome !== 'accepted') {
      return res.status(400).json({ error: 'Chat must have an accepted negotiation to create a transaction.' });
    }

    // Check if a transaction already exists for this chat
    const existing = await Transaction.findOne({ chat: chatId });
    if (existing) return res.json({ transaction: existing, existing: true });

    const transaction = new Transaction({
      listing: chat.listing._id,
      buyer: chat.buyer,
      seller: chat.seller,
      chat: chatId,
      agreedPrice: chat.negotiation.agreedPrice,
      paymentMethod,
    });

    await transaction.save();
    res.status(201).json({ message: 'Transaction created!', transaction });
  } catch (error) {
    console.error('createTransaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
};

/**
 * GET /api/transactions/:id
 * Get a single transaction (buyer or seller only)
 */
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('listing', 'title images price status category condition')
      .populate('buyer', 'displayName anonymousNickname realName showRealIdentity avatarUrl')
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    const userId = req.user._id.toString();
    if (transaction.buyer._id.toString() !== userId && transaction.seller._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const hasRated = await Rating.hasUserRated(transaction._id, req.user._id);
    res.json({ transaction, hasRated });
  } catch (error) {
    console.error('getTransaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
};

/**
 * GET /api/transactions/by-chat/:chatId
 * Fetch existing transaction linked to a chat (buyer or seller)
 */
const getTransactionByChat = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ chat: req.params.chatId })
      .populate('listing', 'title images price status category condition')
      .populate('buyer', 'displayName anonymousNickname realName showRealIdentity avatarUrl')
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    if (!transaction) return res.status(404).json({ error: 'Transaction not found for this chat.' });

    const userId = req.user._id.toString();
    if (transaction.buyer._id.toString() !== userId && transaction.seller._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const hasRated = await Rating.hasUserRated(transaction._id, req.user._id);
    return res.json({ transaction, hasRated });
  } catch (error) {
    console.error('getTransactionByChat error:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
};

/**
 * PUT /api/transactions/:id/pay
 * Buyer marks payment as done (simulated payment flow)
 */
const markPaymentDone = async (req, res) => {
  try {
    const { paymentMethod = 'cash' } = req.body || {};

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can confirm payment.' });
    }

    if (transaction.status === 'completed' || transaction.status === 'cancelled') {
      return res.status(400).json({ error: 'This transaction is already closed.' });
    }

    if (transaction.paymentStatus !== 'paid') {
      transaction.paymentStatus = 'paid';
      transaction.paymentMethod = paymentMethod;
      await transaction.save();
    }

    return res.json({ message: 'Payment confirmed.', transaction });
  } catch (error) {
    console.error('markPaymentDone error:', error);
    return res.status(500).json({ error: 'Failed to confirm payment.' });
  }
};

/**
 * PUT /api/transactions/:id/confirm
 * Buyer or seller confirms the transaction
 */
const confirmTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    if (transaction.paymentStatus !== 'paid') {
      return res.status(400).json({
        error: 'Payment must be confirmed by the buyer before physical handover confirmation.',
      });
    }

    transaction.confirm(req.user._id);
    await transaction.save();

    // Auto-complete when both parties have confirmed — no manual step needed
    if (transaction.isFullyConfirmed) {
      await transaction.complete();
      await transaction.save();
      return res.json({
        message: 'Both parties confirmed! Trade is complete. The listing has been removed.',
        transaction,
        autoCompleted: true,
      });
    }

    const isBuyer = transaction.buyer.toString() === req.user._id.toString();
    res.json({
      message: isBuyer
        ? 'Receipt confirmed. Waiting for seller to confirm handover.'
        : 'Handover confirmed. Waiting for buyer to confirm receipt.',
      transaction,
    });
  } catch (error) {
    if (error.message === 'User is not part of this transaction') {
      return res.status(403).json({ error: error.message });
    }
    console.error('confirmTransaction error:', error);
    res.status(500).json({ error: 'Failed to confirm transaction.' });
  }
};

/**
 * PUT /api/transactions/:id/complete
 * Mark transaction as completed (either party, after both confirmed)
 */
const completeTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    const userId = req.user._id.toString();
    if (transaction.buyer.toString() !== userId && transaction.seller.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await transaction.complete();
    await transaction.save();

    res.json({ message: 'Trade completed! You can now rate each other.', transaction });
  } catch (error) {
    if (error.message === 'Transaction must be confirmed before completing') {
      return res.status(400).json({ error: error.message });
    }
    console.error('completeTransaction error:', error);
    res.status(500).json({ error: 'Failed to complete transaction.' });
  }
};

/**
 * PUT /api/transactions/:id/return
 * Request a return (buyer only, within return window)
 */
const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'A return reason is required.' });

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can request a return.' });
    }

    transaction.requestReturn(reason);
    await transaction.save();

    res.json({ message: 'Return request submitted.', transaction });
  } catch (error) {
    if (error.message.includes('Return window')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('requestReturn error:', error);
    res.status(500).json({ error: 'Failed to request return.' });
  }
};

/**
 * POST /api/transactions/:id/rate
 * Submit an anonymous rating for the other party
 */
const submitRating = async (req, res) => {
  try {
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    const userId = req.user._id.toString();
    const isBuyer = transaction.buyer.toString() === userId;
    const isSeller = transaction.seller.toString() === userId;

    if (!isBuyer && !isSeller) return res.status(403).json({ error: 'Access denied.' });

    if (transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Transaction must be completed before rating.' });
    }

    const alreadyRated = await Rating.hasUserRated(transaction._id, req.user._id);
    if (alreadyRated) return res.status(409).json({ error: 'You have already rated this transaction.' });

    const rateeId = isBuyer ? transaction.seller : transaction.buyer;

    const rating = new Rating({
      transaction: transaction._id,
      rater: req.user._id,
      ratee: rateeId,
      score: Math.round(score),
      comment: comment || '',
    });

    await rating.save(); // post-save hook updates user aggregates & transaction flags

    res.status(201).json({ message: 'Rating submitted anonymously!' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'You have already rated this transaction.' });
    }
    console.error('submitRating error:', error);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
};

/**
 * GET /api/transactions/history
 * Get current user's trade history
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({
      $or: [{ buyer: userId }, { seller: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('listing', 'title images price category')
      .populate('buyer', 'displayName anonymousNickname realName showRealIdentity avatarUrl')
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    res.json({ transactions });
  } catch (error) {
    console.error('getHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch trade history.' });
  }
};

/**
 * GET /api/transactions/by-listing/:listingId
 * Find the auction transaction for a listing (winner or seller only)
 */
const getTransactionByListing = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      listing: req.params.listingId,
      source: 'auction',
    })
      .populate('listing', 'title images price status category condition')
      .populate('buyer', 'displayName anonymousNickname realName showRealIdentity avatarUrl')
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    if (!transaction) return res.status(404).json({ error: 'No auction transaction found for this listing.' });

    const userId = req.user._id.toString();
    if (transaction.buyer._id.toString() !== userId && transaction.seller._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const hasRated = await Rating.hasUserRated(transaction._id, req.user._id);
    return res.json({ transaction, hasRated });
  } catch (error) {
    console.error('getTransactionByListing error:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
};

module.exports = { createTransaction, getTransaction, getTransactionByChat, getTransactionByListing, markPaymentDone, confirmTransaction, completeTransaction, requestReturn, submitRating, getHistory };
