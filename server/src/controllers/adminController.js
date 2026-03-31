const User = require('../models/User');
const Listing = require('../models/Listing');
const Transaction = require('../models/Transaction');
const Chat = require('../models/Chat');

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
const getStats = async (req, res) => {
  try {
    const [userCount, listingCount, activeListings, transactions, disputedTxns] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'disputed' }),
    ]);

    res.json({
      stats: {
        totalUsers: userCount,
        totalListings: listingCount,
        activeListings,
        totalTransactions: transactions,
        disputedTransactions: disputedTxns,
      },
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

/**
 * GET /api/admin/users
 * List all users
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

/**
 * GET /api/admin/disputes
 * List all disputed transactions
 */
const getDisputes = async (req, res) => {
  try {
    const disputes = await Transaction.find({ status: 'disputed' })
      .populate('buyer', 'displayName anonymousNickname realName email hostelBlock')
      .populate('seller', 'displayName anonymousNickname realName email hostelBlock')
      .populate('listing', 'title price category')
      .sort({ updatedAt: -1 });
    res.json({ disputes });
  } catch (error) {
    console.error('getDisputes error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes.' });
  }
};

/**
 * PUT /api/admin/disputes/:id/resolve
 * Resolve a disputed transaction
 */
const resolveDispute = async (req, res) => {
  try {
    const { resolution } = req.body; // 'refunded', 'completed', 'cancelled'
    const validResolutions = ['refunded', 'completed', 'cancelled'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({ error: 'Resolution must be: refunded, completed, or cancelled.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });
    if (transaction.status !== 'disputed') {
      return res.status(400).json({ error: 'Transaction is not in disputed state.' });
    }

    if (resolution === 'refunded') {
      transaction.status = 'cancelled';
      transaction.paymentStatus = 'refunded';
      // Reactivate the listing
      await Listing.findByIdAndUpdate(transaction.listing, { status: 'active' });
    } else if (resolution === 'completed') {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
    } else {
      transaction.status = 'cancelled';
    }

    await transaction.save();
    res.json({ message: `Dispute resolved: ${resolution}`, transaction });
  } catch (error) {
    console.error('resolveDispute error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute.' });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or admin.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ message: `User role updated to ${role}`, user });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
};

/**
 * GET /api/admin/flagged-listings
 * Get listings that have been reported or have issues
 */
const getFlaggedListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'removed' })
      .populate('seller', 'displayName anonymousNickname realName email')
      .sort({ updatedAt: -1 });
    res.json({ listings });
  } catch (error) {
    console.error('getFlaggedListings error:', error);
    res.status(500).json({ error: 'Failed to fetch flagged listings.' });
  }
};

module.exports = { getStats, getUsers, getDisputes, resolveDispute, updateUserRole, getFlaggedListings };
