const Listing = require('../models/Listing');
const { CATEGORIES, CONDITIONS, LISTING_TYPES } = require('../models/Listing');

const MAX_ACTIVE_LISTINGS = Number(process.env.MAX_ACTIVE_LISTINGS || 25);

function validateRentalDetails(details = {}) {
  if (!details || typeof details !== 'object') {
    return 'Rental details are required for rent listings.';
  }

  if (!details.pricePerDay || Number(details.pricePerDay) <= 0) {
    return 'Rent listings must include a valid per-day price.';
  }

  if (details.maxRentalDays && Number(details.maxRentalDays) > 365) {
    return 'Maximum rental duration cannot exceed 365 days.';
  }

  if (details.availableFrom && details.availableTo) {
    const from = new Date(details.availableFrom).getTime();
    const to = new Date(details.availableTo).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
      return 'Rental availability dates are invalid.';
    }
  }

  return null;
}

/**
 * GET /api/listings
 * Browse listings with filters, search, and pagination
 */
const getListings = async (req, res) => {
  try {
    const {
      category,
      condition,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
      sort = 'newest',
    } = req.query;

    const filter = { status: 'active' };

    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (condition && CONDITIONS.includes(condition)) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let query;
    if (search) {
      query = Listing.find({ ...filter, $text: { $search: search } }, { score: { $meta: 'textScore' } });
    } else {
      query = Listing.find(filter);
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      popular: { viewCount: -1 },
    };
    const sortBy = search ? { score: { $meta: 'textScore' } } : (sortOptions[sort] || sortOptions.newest);

    const skip = (Number(page) - 1) * Number(limit);
    const [listings, total] = await Promise.all([
      query
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit))
        .populate('seller', 'displayName anonymousNickname realName showRealIdentity hostelBlock avatarUrl totalTrades isRatingVisible averageRating'),
      Listing.countDocuments(filter),
    ]);

    res.json({
      listings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('getListings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings.' });
  }
};

/**
 * GET /api/listings/:id
 * Get a single listing and increment view count
 */
const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity hostelBlock avatarUrl totalTrades isRatingVisible averageRating tradesUntilRatingVisible');

    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    // Deduplicated view count: use userId or IP fingerprint
    const viewerId = req.user ? req.user._id.toString() : (req.ip || 'anon');
    const listingWithViews = await Listing.findById(req.params.id).select('viewedBy');
    if (listingWithViews && !listingWithViews.viewedBy.includes(viewerId)) {
      Listing.findByIdAndUpdate(req.params.id, {
        $inc: { viewCount: 1 },
        $push: { viewedBy: viewerId },
      }).exec();
    }

    res.json({ listing });
  } catch (error) {
    console.error('getListing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing.' });
  }
};

/**
 * POST /api/listings
 * Create a new listing (authenticated)
 */
const createListing = async (req, res) => {
  try {
    const { title, description, category, price, condition, images, videos, priceReferenceLink, listingType, rentalDetails } = req.body;

    if (!title || !description || !category || price === undefined || !condition || !images) {
      return res.status(400).json({ error: 'Title, description, category, price, condition, and images are required.' });
    }

    const nextListingType = listingType || 'sell';
    if (!LISTING_TYPES.includes(nextListingType)) {
      return res.status(400).json({ error: 'Invalid listing type.' });
    }

    if (nextListingType === 'rent') {
      const rentalError = validateRentalDetails(rentalDetails);
      if (rentalError) return res.status(400).json({ error: rentalError });
    }

    const activeCount = await Listing.countDocuments({
      seller: req.user._id,
      status: { $in: ['active', 'reserved'] },
    });

    if (activeCount >= MAX_ACTIVE_LISTINGS) {
      return res.status(429).json({
        error: `You have reached the active listing limit (${MAX_ACTIVE_LISTINGS}). Mark older listings as sold/removed before creating new ones.`,
      });
    }

    const listing = new Listing({
      seller: req.user._id,
      title,
      description,
      category,
      price,
      condition,
      images,
      videos: videos || [],
      priceReferenceLink: priceReferenceLink || undefined,
      listingType: nextListingType,
      rentalDetails: nextListingType === 'rent' ? rentalDetails : undefined,
    });

    await listing.save();
    await listing.populate('seller', 'displayName anonymousNickname realName showRealIdentity hostelBlock avatarUrl');

    res.status(201).json({ message: 'Listing created!', listing });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('createListing error:', error);
    res.status(500).json({ error: 'Failed to create listing.' });
  }
};

/**
 * PUT /api/listings/:id
 * Update a listing (seller only)
 */
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the seller can update this listing.' });
    }

    if (listing.status === 'sold') {
      return res.status(400).json({ error: 'Cannot edit a sold listing.' });
    }

    const allowed = ['title', 'description', 'category', 'price', 'condition', 'images', 'videos', 'priceReferenceLink', 'status', 'listingType', 'rentalDetails'];

    if (req.body.listingType && !LISTING_TYPES.includes(req.body.listingType)) {
      return res.status(400).json({ error: 'Invalid listing type.' });
    }

    const targetType = req.body.listingType || listing.listingType;
    const targetRentalDetails = req.body.rentalDetails || listing.rentalDetails;
    if (targetType === 'rent') {
      const rentalError = validateRentalDetails(targetRentalDetails);
      if (rentalError) return res.status(400).json({ error: rentalError });
    }

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) listing[field] = req.body[field];
    });

    await listing.save();
    res.json({ message: 'Listing updated!', listing });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('updateListing error:', error);
    res.status(500).json({ error: 'Failed to update listing.' });
  }
};

/**
 * DELETE /api/listings/:id
 * Remove a listing (seller only, sets status to 'removed')
 */
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the seller can remove this listing.' });
    }

    listing.status = 'removed';
    await listing.save();

    res.json({ message: 'Listing removed.' });
  } catch (error) {
    console.error('deleteListing error:', error);
    res.status(500).json({ error: 'Failed to remove listing.' });
  }
};

/**
 * POST /api/listings/:id/interest
 * Mark interest in a listing (increments interestCount)
 */
const markInterest = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    // Deduplicate: only count each user once
    if (listing.interestedUsers && listing.interestedUsers.includes(req.user._id.toString())) {
      return res.json({
        interestCount: listing.interestCount,
        shouldSuggestAuction: listing.shouldSuggestAuction,
        alreadyInterested: true,
      });
    }

    listing.interestedUsers.push(req.user._id);
    listing.interestCount = listing.interestedUsers.length;
    await listing.save();

    res.json({
      interestCount: listing.interestCount,
      shouldSuggestAuction: listing.shouldSuggestAuction,
      alreadyInterested: false,
    });
  } catch (error) {
    console.error('markInterest error:', error);
    res.status(500).json({ error: 'Failed to register interest.' });
  }
};

/**
 * GET /api/listings/my
 * Get the current user's listings
 */
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) {
    console.error('getMyListings error:', error);
    res.status(500).json({ error: 'Failed to fetch your listings.' });
  }
};

/**
 * PUT /api/listings/:id/auction
 * Enable auction mode on a listing (seller only)
 */
const enableAuction = async (req, res) => {
  try {
    const { auctionDeposit } = req.body;
    if (!auctionDeposit || auctionDeposit <= 0) {
      return res.status(400).json({ error: 'A valid auction deposit is required.' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the seller can enable auction mode.' });
    }

    listing.auctionMode = true;
    listing.auctionDeposit = auctionDeposit;
    await listing.save();

    res.json({ message: 'Auction mode enabled!', listing });
  } catch (error) {
    console.error('enableAuction error:', error);
    res.status(500).json({ error: 'Failed to enable auction mode.' });
  }
};

module.exports = { getListings, getListing, createListing, updateListing, deleteListing, markInterest, getMyListings, enableAuction };
