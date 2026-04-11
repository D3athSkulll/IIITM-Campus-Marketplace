const BuyerDemand = require('../models/BuyerDemand');
const { CATEGORIES } = require('../models/Listing');

/**
 * GET /api/demands
 * List open buyer demands with optional filters
 */
const getDemands = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const filter = { status: 'open' };
    if (category && CATEGORIES.includes(category)) filter.category = category;

    let query;
    if (search) {
      query = BuyerDemand.find({ ...filter, $text: { $search: search } }, { score: { $meta: 'textScore' } });
    } else {
      query = BuyerDemand.find(filter);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [demands, total] = await Promise.all([
      query
        .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('buyer', 'displayName anonymousNickname realName showRealIdentity hostelBlock avatarUrl'),
      BuyerDemand.countDocuments(filter),
    ]);

    res.json({
      demands,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('getDemands error:', error);
    res.status(500).json({ error: 'Failed to fetch demands.' });
  }
};

/**
 * GET /api/demands/:id
 * Get a single demand
 */
const getDemand = async (req, res) => {
  try {
    const demand = await BuyerDemand.findById(req.params.id)
      .populate('buyer', 'displayName anonymousNickname realName showRealIdentity hostelBlock avatarUrl');

    if (!demand) return res.status(404).json({ error: 'Demand not found.' });
    res.json({ demand });
  } catch (error) {
    console.error('getDemand error:', error);
    res.status(500).json({ error: 'Failed to fetch demand.' });
  }
};

/**
 * POST /api/demands
 * Create a buyer demand (authenticated)
 */
const createDemand = async (req, res) => {
  try {
    const { title, description, category, budgetMin, budgetMax } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required.' });
    }

    const demand = new BuyerDemand({
      buyer: req.user._id,
      title,
      description: description || '',
      category,
      budgetMin: budgetMin !== undefined ? budgetMin : null,
      budgetMax: budgetMax !== undefined ? budgetMax : null,
    });

    await demand.save();
    await demand.populate('buyer', 'displayName anonymousNickname realName showRealIdentity hostelBlock avatarUrl');

    res.status(201).json({ message: 'Demand posted!', demand });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('createDemand error:', error);
    res.status(500).json({ error: 'Failed to post demand.' });
  }
};

/**
 * PUT /api/demands/:id/close
 * Close/fulfil a demand (buyer only)
 */
const closeDemand = async (req, res) => {
  try {
    const demand = await BuyerDemand.findById(req.params.id);
    if (!demand) return res.status(404).json({ error: 'Demand not found.' });

    if (demand.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can close this demand.' });
    }

    demand.status = req.body.status === 'fulfilled' ? 'fulfilled' : 'expired';
    await demand.save();

    res.json({ message: 'Demand closed.', demand });
  } catch (error) {
    console.error('closeDemand error:', error);
    res.status(500).json({ error: 'Failed to close demand.' });
  }
};

/**
 * DELETE /api/demands/:id
 * Delete a demand (buyer only)
 */
const deleteDemand = async (req, res) => {
  try {
    const demand = await BuyerDemand.findById(req.params.id);
    if (!demand) return res.status(404).json({ error: 'Demand not found.' });

    if (demand.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can delete this demand.' });
    }

    await demand.deleteOne();
    res.json({ message: 'Demand deleted.' });
  } catch (error) {
    console.error('deleteDemand error:', error);
    res.status(500).json({ error: 'Failed to delete demand.' });
  }
};

/**
 * GET /api/demands/my
 * Get current user's demands
 */
const getMyDemands = async (req, res) => {
  try {
    const demands = await BuyerDemand.find({ buyer: req.user._id }).sort({ createdAt: -1 });
    res.json({ demands });
  } catch (error) {
    console.error('getMyDemands error:', error);
    res.status(500).json({ error: 'Failed to fetch your demands.' });
  }
};

module.exports = { getDemands, getDemand, createDemand, closeDemand, deleteDemand, getMyDemands };
