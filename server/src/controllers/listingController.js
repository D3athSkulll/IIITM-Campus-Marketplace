const Listing = require('../models/Listing');
const { CATEGORIES, CONDITIONS, LISTING_TYPES } = require('../models/Listing');
const Transaction = require('../models/Transaction');

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

function toIdString(value) {
  if (!value) return '';
  return value.toString();
}

function hasUserInList(list = [], userId) {
  const target = toIdString(userId);
  return list.some((item) => toIdString(item) === target);
}

function removeUserFromList(list = [], userId) {
  const target = toIdString(userId);
  return list.filter((item) => toIdString(item) !== target);
}

function computeHighestBid(auctionBids = []) {
  if (!Array.isArray(auctionBids) || auctionBids.length === 0) return null;
  return [...auctionBids].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  })[0];
}

function getTopBidByBidder(auctionBids = []) {
  const topByBidder = new Map();

  auctionBids.forEach((bid) => {
    const bidderId = toIdString(bid.bidder?._id || bid.bidder);
    if (!bidderId) return;

    const currentTop = topByBidder.get(bidderId);
    if (!currentTop) {
      topByBidder.set(bidderId, bid);
      return;
    }

    if (bid.amount > currentTop.amount) {
      topByBidder.set(bidderId, bid);
      return;
    }

    if (
      bid.amount === currentTop.amount
      && new Date(bid.createdAt).getTime() < new Date(currentTop.createdAt).getTime()
    ) {
      topByBidder.set(bidderId, bid);
    }
  });

  return Array.from(topByBidder.values()).sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function resolveBidderLabel({ bid, viewerId, anonymousIndexByBidder }) {
  const bidderId = toIdString(bid.bidder?._id || bid.bidder);
  const isCurrentUser = viewerId && bidderId === viewerId;

  if (isCurrentUser) {
    return { bidderId, isCurrentUser: true, bidderLabel: 'You' };
  }

  if (bid.showBidderName) {
    return {
      bidderId,
      isCurrentUser: false,
      bidderLabel: bid.bidder?.displayName || `Bidder ${bidderId.slice(-4)}`,
    };
  }

  if (!anonymousIndexByBidder.has(bidderId)) {
    anonymousIndexByBidder.set(bidderId, anonymousIndexByBidder.size + 1);
  }

  return {
    bidderId,
    isCurrentUser: false,
    bidderLabel: `Anonymous #${anonymousIndexByBidder.get(bidderId)}`,
  };
}

function buildAuctionState(listing, viewerId = '') {
  const auctionBids = Array.isArray(listing.auctionBids) ? listing.auctionBids : [];
  const anonymousIndexByBidder = new Map();

  const nowMs = Date.now();
  const endsAtMs = listing.auctionEndsAt ? new Date(listing.auctionEndsAt).getTime() : null;
  const isTimedOut = endsAtMs ? nowMs >= endsAtMs : false;
  const isClosed = Boolean(listing.auctionClosedAt) || isTimedOut;

  const topBidPerBidder = getTopBidByBidder(auctionBids);
  const leaderboard = topBidPerBidder.map((bid, idx) => {
    const bidder = resolveBidderLabel({ bid, viewerId, anonymousIndexByBidder });
    return {
      rank: idx + 1,
      amount: bid.amount,
      createdAt: bid.createdAt,
      bidderId: bidder.bidderId,
      bidderLabel: bidder.bidderLabel,
      isCurrentUser: bidder.isCurrentUser,
      showBidderName: Boolean(bid.showBidderName),
    };
  });

  const highestBid = leaderboard[0] || null;
  const viewerBestBid = leaderboard.find((entry) => entry.bidderId === viewerId) || null;
  const uniqueBidderCount = new Set(topBidPerBidder.map((bid) => toIdString(bid.bidder?._id || bid.bidder))).size;

  const timeline = [...auctionBids]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-20)
    .map((bid, idx) => {
      const bidder = resolveBidderLabel({ bid, viewerId, anonymousIndexByBidder });
      return {
        step: idx + 1,
        amount: bid.amount,
        createdAt: bid.createdAt,
        bidderId: bidder.bidderId,
        bidderLabel: bidder.bidderLabel,
        isCurrentUser: bidder.isCurrentUser,
      };
    });

  return {
    enabled: Boolean(listing.auctionMode),
    isClosed,
    isTimedOut,
    endsAt: listing.auctionEndsAt || null,
    closedAt: listing.auctionClosedAt || null,
    deposit: listing.auctionDeposit || 0,
    minBid: listing.auctionMinBid ?? null,
    maxBid: listing.auctionMaxBid ?? null,
    bidCount: auctionBids.length,
    uniqueBidderCount,
    highestBid,
    myHighestBid: viewerBestBid ? viewerBestBid.amount : null,
    myRank: viewerBestBid ? viewerBestBid.rank : null,
    timeLeftMs: endsAtMs ? Math.max(0, endsAtMs - nowMs) : null,
    leaderboard,
    timeline,
  };
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
    const viewerUserId = req.user ? req.user._id.toString() : null;
    const viewerId = viewerUserId || req.ip || 'anon';
    const listingWithViews = await Listing.findById(req.params.id).select('viewedBy');
    if (listingWithViews && !listingWithViews.viewedBy.includes(viewerId)) {
      Listing.findByIdAndUpdate(req.params.id, {
        $inc: { viewCount: 1 },
        $push: { viewedBy: viewerId },
      }).exec();
    }

    const listingData = listing.toObject();
    const highestBid = computeHighestBid(listing.auctionBids || []);
    const uniqueBidderCount = new Set((listing.auctionBids || []).map((bid) => toIdString(bid.bidder?._id || bid.bidder))).size;

    listingData.manualAuctionRequestCount = listing.auctionRequestedBy.length;
    listingData.isInterested = viewerUserId ? hasUserInList(listing.interestedUsers, viewerUserId) : false;
    listingData.hasRequestedAuction = viewerUserId ? hasUserInList(listing.auctionRequestedBy, viewerUserId) : false;
    listingData.auctionBidCount = Array.isArray(listing.auctionBids) ? listing.auctionBids.length : 0;
    listingData.auctionUniqueBidderCount = uniqueBidderCount;
    listingData.auctionHighestBid = highestBid ? highestBid.amount : null;
    delete listingData.auctionBids;

    res.json({ listing: listingData });
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

    const alreadyInterested = hasUserInList(listing.interestedUsers, req.user._id);
    if (alreadyInterested) {
      listing.interestedUsers = removeUserFromList(listing.interestedUsers, req.user._id);
    } else {
      listing.interestedUsers.push(req.user._id);
    }

    listing.interestCount = listing.interestedUsers.length;
    await listing.save();

    res.json({
      interested: !alreadyInterested,
      interestCount: listing.interestCount,
      shouldSuggestAuction: listing.shouldSuggestAuction,
      alreadyInterested,
      hasRequestedAuction: hasUserInList(listing.auctionRequestedBy, req.user._id),
    });
  } catch (error) {
    console.error('markInterest error:', error);
    res.status(500).json({ error: 'Failed to register interest.' });
  }
};

/**
 * POST /api/listings/:id/auction-request
 * Buyer manually requests seller to switch listing to auction mode
 */
const requestAuctionByBuyer = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'Only active listings can receive auction requests.' });
    }

    if (listing.auctionMode) {
      return res.status(400).json({ error: 'This listing is already in auction mode.' });
    }

    if (toIdString(listing.seller) === toIdString(req.user._id)) {
      return res.status(400).json({ error: 'Sellers cannot request auction mode on their own listing.' });
    }

    const alreadyRequested = hasUserInList(listing.auctionRequestedBy, req.user._id);

    if (!hasUserInList(listing.interestedUsers, req.user._id)) {
      listing.interestedUsers.push(req.user._id);
    }

    if (!alreadyRequested) {
      listing.auctionRequestedBy.push(req.user._id);
    }

    listing.interestCount = listing.interestedUsers.length;
    await listing.save();

    res.json({
      requested: true,
      alreadyRequested,
      interestCount: listing.interestCount,
      manualAuctionRequestCount: listing.auctionRequestedBy.length,
      shouldSuggestAuction: listing.shouldSuggestAuction,
      message: alreadyRequested
        ? 'Auction request already sent to the seller.'
        : 'Auction request sent to the seller.',
    });
  } catch (error) {
    console.error('requestAuctionByBuyer error:', error);
    res.status(500).json({ error: 'Failed to request auction mode.' });
  }
};

/**
 * DELETE /api/listings/:id/auction-request
 * Withdraw a buyer's auction request
 */
const withdrawAuctionRequest = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.auctionMode) {
      return res.status(400).json({ error: 'Auction is already active. Cannot withdraw request.' });
    }

    const hadRequested = hasUserInList(listing.auctionRequestedBy, req.user._id);
    if (!hadRequested) {
      return res.status(400).json({ error: 'You have no pending auction request for this listing.' });
    }

    listing.auctionRequestedBy = removeUserFromList(listing.auctionRequestedBy, req.user._id);
    await listing.save();

    res.json({
      withdrawn: true,
      manualAuctionRequestCount: listing.auctionRequestedBy.length,
      shouldSuggestAuction: listing.shouldSuggestAuction,
      message: 'Auction request withdrawn.',
    });
  } catch (error) {
    console.error('withdrawAuctionRequest error:', error);
    res.status(500).json({ error: 'Failed to withdraw auction request.' });
  }
};

/**
 * GET /api/listings/:id/auction
 * Get auction configuration, ranking, and bid timeline
 */
const getAuctionDetails = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity hostelBlock avatarUrl')
      .populate('auctionBids.bidder', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const viewerId = req.user ? toIdString(req.user._id) : '';
    const isSeller = viewerId && toIdString(listing.seller._id || listing.seller) === viewerId;
    const viewerRole = !viewerId ? 'guest' : (isSeller ? 'seller' : 'buyer');

    const auction = buildAuctionState(listing, viewerId);

    const isWinner = viewerId && listing.auctionWinner
      ? toIdString(listing.auctionWinner) === viewerId
      : false;

    res.json({
      listing: {
        _id: listing._id,
        title: listing.title,
        price: listing.price,
        status: listing.status,
        auctionMode: listing.auctionMode,
        seller: listing.seller,
        auctionDeposit: listing.auctionDeposit || null,
        auctionMinBid: listing.auctionMinBid ?? null,
        auctionMaxBid: listing.auctionMaxBid ?? null,
        auctionEndsAt: listing.auctionEndsAt || null,
        auctionClosedAt: listing.auctionClosedAt || null,
      },
      auction,
      viewerRole,
      canConfigureAuction: isSeller && listing.status === 'active',
      canBid: viewerRole === 'buyer' && listing.status === 'active' && listing.auctionMode && !auction.isClosed,
      isWinner,
      transactionId: listing.auctionTransactionId ? String(listing.auctionTransactionId) : null,
    });
  } catch (error) {
    console.error('getAuctionDetails error:', error);
    res.status(500).json({ error: 'Failed to fetch auction details.' });
  }
};

/**
 * POST /api/listings/:id/auction/bid
 * Place a bid as a buyer during active auction
 */
const placeAuctionBid = async (req, res) => {
  try {
    const { amount, showBidderName = false } = req.body || {};
    const bidAmount = Number(amount);

    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Enter a valid bid amount.' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (!listing.auctionMode) {
      return res.status(400).json({ error: 'Auction mode is not enabled for this listing.' });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'Only active listings can accept bids.' });
    }

    if (toIdString(listing.seller) === toIdString(req.user._id)) {
      return res.status(400).json({ error: 'Sellers cannot bid on their own listing.' });
    }

    if (listing.auctionClosedAt) {
      return res.status(400).json({ error: 'This auction has already been closed by the seller.' });
    }

    if (listing.auctionEndsAt && Date.now() >= new Date(listing.auctionEndsAt).getTime()) {
      return res.status(400).json({ error: 'This auction has reached its time limit.' });
    }

    const minBid = Number.isFinite(listing.auctionMinBid) ? listing.auctionMinBid : listing.price;
    const maxBid = Number.isFinite(listing.auctionMaxBid) ? listing.auctionMaxBid : Number.MAX_SAFE_INTEGER;

    if (bidAmount < minBid) {
      return res.status(400).json({ error: `Bid must be at least ₹${minBid.toLocaleString('en-IN')}.` });
    }

    if (bidAmount > maxBid) {
      return res.status(400).json({ error: `Bid cannot exceed ₹${maxBid.toLocaleString('en-IN')}.` });
    }

    const highestBid = computeHighestBid(listing.auctionBids || []);
    if (highestBid && bidAmount <= highestBid.amount) {
      return res.status(400).json({
        error: `Bid must be higher than current highest bid ₹${highestBid.amount.toLocaleString('en-IN')}.`,
      });
    }

    listing.auctionBids.push({
      bidder: req.user._id,
      amount: bidAmount,
      showBidderName: Boolean(showBidderName),
    });

    if (!hasUserInList(listing.interestedUsers, req.user._id)) {
      listing.interestedUsers.push(req.user._id);
      listing.interestCount = listing.interestedUsers.length;
    }

    await listing.save();
    await listing.populate('auctionBids.bidder', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    const auction = buildAuctionState(listing, toIdString(req.user._id));
    return res.status(201).json({
      message: 'Bid placed successfully.',
      auction,
    });
  } catch (error) {
    console.error('placeAuctionBid error:', error);
    return res.status(500).json({ error: 'Failed to place bid.' });
  }
};

/**
 * POST /api/listings/:id/auction/close
 * Seller manually closes auction and locks winner
 */
const closeAuction = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('auctionBids.bidder', 'displayName anonymousNickname realName showRealIdentity avatarUrl')
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (toIdString(listing.seller._id || listing.seller) !== toIdString(req.user._id)) {
      return res.status(403).json({ error: 'Only the seller can close this auction.' });
    }

    if (!listing.auctionMode) {
      return res.status(400).json({ error: 'Auction mode is not enabled for this listing.' });
    }

    if (listing.auctionClosedAt) {
      return res.status(400).json({ error: 'Auction is already closed.' });
    }

    const highestBid = computeHighestBid(listing.auctionBids || []);
    listing.auctionClosedAt = new Date();
    const winnerId = highestBid ? toIdString(highestBid.bidder?._id || highestBid.bidder) : null;
    listing.auctionWinner = winnerId || null;

    if (highestBid && listing.status === 'active') {
      listing.status = 'reserved';
    }

    await listing.save();

    // Auto-create a transaction for the winner so they can pay immediately
    let auctionTx = null;
    if (highestBid && winnerId) {
      try {
        auctionTx = await Transaction.findOne({ listing: listing._id, source: 'auction' });
        if (!auctionTx) {
          auctionTx = await Transaction.create({
            listing: listing._id,
            buyer: winnerId,
            seller: toIdString(listing.seller._id || listing.seller),
            chat: null,
            agreedPrice: highestBid.amount,
            source: 'auction',
            paymentMethod: 'cash',
          });
          listing.auctionTransactionId = auctionTx._id;
          await listing.save();
        }
      } catch (txErr) {
        console.error('Auto-create auction transaction failed:', txErr.message);
      }
    }

    const auction = buildAuctionState(listing, toIdString(req.user._id));
    return res.json({
      message: highestBid ? 'Auction closed and winner locked.' : 'Auction closed with no bids.',
      winnerBid: highestBid ? {
        amount: highestBid.amount,
        bidderLabel: highestBid.showBidderName
          ? (highestBid.bidder?.displayName || 'Winner')
          : 'Anonymous winner',
      } : null,
      transactionId: auctionTx ? String(auctionTx._id) : null,
      auction,
    });
  } catch (error) {
    console.error('closeAuction error:', error);
    return res.status(500).json({ error: 'Failed to close auction.' });
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
    const { auctionDeposit, auctionMinBid, auctionMaxBid, auctionEndsAt } = req.body || {};

    const depositAmount = Number(auctionDeposit);
    const minBid = Number(auctionMinBid);
    const maxBid = Number(auctionMaxBid);

    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ error: 'A valid auction deposit is required.' });
    }
    if (!Number.isFinite(minBid) || minBid <= 0) {
      return res.status(400).json({ error: 'A valid minimum bid is required.' });
    }
    if (!Number.isFinite(maxBid) || maxBid <= minBid) {
      return res.status(400).json({ error: 'Maximum bid must be greater than minimum bid.' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the seller can enable auction mode.' });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'Only active listings can be switched to auction mode.' });
    }

    let parsedEndsAt = null;
    if (auctionEndsAt) {
      parsedEndsAt = new Date(auctionEndsAt);
      if (Number.isNaN(parsedEndsAt.getTime())) {
        return res.status(400).json({ error: 'Auction deadline must be a valid date-time.' });
      }
      if (parsedEndsAt.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Auction deadline must be in the future.' });
      }
    }

    listing.auctionMode = true;
    listing.auctionDeposit = depositAmount;
    listing.auctionMinBid = minBid;
    listing.auctionMaxBid = maxBid;
    listing.auctionEndsAt = parsedEndsAt;
    listing.auctionClosedAt = null;
    listing.auctionWinner = null;
    listing.auctionBids = [];
    listing.auctionRequestedBy = [];
    await listing.save();

    res.json({ message: 'Auction mode enabled!', listing });
  } catch (error) {
    console.error('enableAuction error:', error);
    res.status(500).json({ error: 'Failed to enable auction mode.' });
  }
};

/**
 * PUT /api/listings/:id/link-demand
 * Link a demand to a listing (seller only)
 */
const linkDemand = async (req, res) => {
  try {
    const { demandId } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the seller can link demands.' });
    }

    if (demandId) {
      const BuyerDemand = require('../models/BuyerDemand');
      const demand = await BuyerDemand.findById(demandId);
      if (!demand) return res.status(404).json({ error: 'Demand not found.' });
    }

    listing.relatedDemand = demandId || null;
    await listing.save();

    await listing.populate('relatedDemand');
    res.json({ message: 'Demand linked!', listing });
  } catch (error) {
    console.error('linkDemand error:', error);
    res.status(500).json({ error: 'Failed to link demand.' });
  }
};

module.exports = {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markInterest,
  requestAuctionByBuyer,
  withdrawAuctionRequest,
  getAuctionDetails,
  placeAuctionBid,
  closeAuction,
  getMyListings,
  enableAuction,
  linkDemand,
};
