const mongoose = require('mongoose');

// ─── Category & Condition Enums ─────────────────────────────────────────────────
const CATEGORIES = [
  'books',
  'electronics',
  'clothing',
  'furniture',
  'stationery',
  'sports',
  'accessories',
  'other',
];

const CONDITIONS = ['like-new', 'good', 'fair', 'poor'];

const LISTING_STATUSES = ['active', 'sold', 'reserved', 'removed'];
const LISTING_TYPES = ['sell', 'rent'];

const auctionBidSchema = new mongoose.Schema(
  {
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Bid amount cannot be negative'],
    },
    showBidderName: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ─── Listing Schema ─────────────────────────────────────────────────────────────
const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },

    listingType: {
      type: String,
      enum: { values: LISTING_TYPES, message: '{VALUE} is not a valid listing type' },
      default: 'sell',
    },

    rentalDetails: {
      pricePerDay: { type: Number, min: 0 },
      depositAmount: { type: Number, min: 0 },
      maxRentalDays: { type: Number, min: 1 },
      availableFrom: { type: Date },
      availableTo: { type: Date },
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: CONDITIONS,
        message: '{VALUE} is not a valid condition',
      },
    },

    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 1 && v.length <= 5;
        },
        message: 'Must have between 1 and 5 images',
      },
    },

    videos: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 2;
        },
        message: 'Cannot have more than 2 videos',
      },
      default: [],
    },

    priceReferenceLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional field
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Price reference link must be a valid URL',
      },
    },

    status: {
      type: String,
      enum: {
        values: LISTING_STATUSES,
        message: '{VALUE} is not a valid listing status',
      },
      default: 'active',
    },

    // ── Auction Mode ──────────────────────────────────────────────────────────
    auctionMode: {
      type: Boolean,
      default: false,
    },

    auctionDeposit: {
      type: Number,
      min: [0, 'Deposit cannot be negative'],
      validate: {
        validator: function (v) {
          // Required only if auctionMode is true
          if (this.auctionMode && (!v || v <= 0)) return false;
          return true;
        },
        message: 'Auction deposit is required when auction mode is enabled',
      },
    },

    auctionMinBid: {
      type: Number,
      min: [0, 'Minimum bid cannot be negative'],
      validate: {
        validator: function (v) {
          if (!this.auctionMode && (v === undefined || v === null)) return true;
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Minimum bid is required when auction mode is enabled',
      },
    },

    auctionMaxBid: {
      type: Number,
      min: [0, 'Maximum bid cannot be negative'],
      validate: {
        validator: function (v) {
          if (!this.auctionMode && (v === undefined || v === null)) return true;
          if (!Number.isFinite(v) || v <= 0) return false;
          if (this.auctionMinBid === undefined || this.auctionMinBid === null) return true;
          return v > this.auctionMinBid;
        },
        message: 'Maximum bid must be greater than minimum bid when auction mode is enabled',
      },
    },

    auctionEndsAt: {
      type: Date,
      default: null,
    },

    auctionClosedAt: {
      type: Date,
      default: null,
    },

    auctionWinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Transaction created automatically when auction closes
    auctionTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },

    auctionBids: {
      type: [auctionBidSchema],
      default: [],
    },

    // ── Engagement Metrics ────────────────────────────────────────────────────
    interestedUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    auctionRequestedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    interestCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Track unique viewers (by userId or IP hash) to prevent double-counting
    viewedBy: {
      type: [String],
      default: [],
      select: false, // Don't send this in API responses
    },

    // ── Demand Linking ────────────────────────────────────────────────────────
    relatedDemand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyerDemand',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ───────────────────────────────────────────────────────────────────

// Flag high-interest listings that should be suggested for auction mode
listingSchema.virtual('shouldSuggestAuction').get(function () {
  // Suggest auction if 2+ buyers have shown interest OR any buyer explicitly requested it.
  const requestCount = Array.isArray(this.auctionRequestedBy) ? this.auctionRequestedBy.length : 0;
  return !this.auctionMode && (this.interestCount >= 2 || requestCount > 0);
});

// ─── Indexes ────────────────────────────────────────────────────────────────────
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ status: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ auctionMode: 1, auctionEndsAt: 1 });
listingSchema.index(
  { title: 'text', description: 'text' },
  { weights: { title: 10, description: 5 } }
);

// ─── Export ─────────────────────────────────────────────────────────────────────
const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
module.exports.LISTING_STATUSES = LISTING_STATUSES;
module.exports.LISTING_TYPES = LISTING_TYPES;
