const mongoose = require('mongoose');

// ─── Transaction Statuses ───────────────────────────────────────────────────────
const TRANSACTION_STATUSES = [
  'pending-confirmation',
  'confirmed',
  'disputed',
  'completed',
  'cancelled',
];

const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];

// ─── Return Policy Sub-document ─────────────────────────────────────────────────
const returnPolicySchema = new mongoose.Schema(
  {
    eligible: {
      type: Boolean,
      default: true,
    },

    // 1-2 day return window from transaction creation
    deadline: {
      type: Date,
      default: function () {
        const now = new Date();
        now.setDate(now.getDate() + 2); // 2-day return window
        return now;
      },
    },

    returnRequested: {
      type: Boolean,
      default: false,
    },

    returnReason: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// ─── Transaction Schema ─────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      default: null, // null for auction-sourced transactions
    },

    // How this transaction was created
    source: {
      type: String,
      enum: ['negotiation', 'auction'],
      default: 'negotiation',
    },

    agreedPrice: {
      type: Number,
      required: [true, 'Agreed price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // ── Dummy Payment Gateway ─────────────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },

    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'in-app-wallet'],
      default: 'cash',
    },

    // ── Return Policy ─────────────────────────────────────────────────────────
    returnPolicy: {
      type: returnPolicySchema,
      default: () => ({}),
    },

    // ── Confirmation Flow ─────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: TRANSACTION_STATUSES,
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'pending-confirmation',
    },

    buyerConfirmed: {
      type: Boolean,
      default: false,
    },

    sellerConfirmed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // ── Ratings Tracking ──────────────────────────────────────────────────────
    buyerRated: {
      type: Boolean,
      default: false,
    },

    sellerRated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ───────────────────────────────────────────────────────────────────

// Whether return is still possible
transactionSchema.virtual('isReturnEligible').get(function () {
  if (!this.returnPolicy.eligible) return false;
  return new Date() <= this.returnPolicy.deadline;
});

// Whether both parties have confirmed
transactionSchema.virtual('isFullyConfirmed').get(function () {
  return this.buyerConfirmed && this.sellerConfirmed;
});

// ─── Instance Methods ───────────────────────────────────────────────────────────

// Confirm trade from buyer or seller side
transactionSchema.methods.confirm = function (userId) {
  const isBuyer = this.buyer.toString() === userId.toString();
  const isSeller = this.seller.toString() === userId.toString();

  if (!isBuyer && !isSeller) {
    throw new Error('User is not part of this transaction');
  }

  if (isBuyer) this.buyerConfirmed = true;
  if (isSeller) this.sellerConfirmed = true;

  // If both confirmed, mark as confirmed
  if (this.buyerConfirmed && this.sellerConfirmed) {
    this.status = 'confirmed';
  }

  return this;
};

// Mark transaction as completed (after confirmation + rating period)
transactionSchema.methods.complete = async function () {
  if (this.status !== 'confirmed') {
    throw new Error('Transaction must be confirmed before completing');
  }

  this.status = 'completed';
  this.completedAt = new Date();

  // Increment totalTrades for both users
  const User = mongoose.model('User');
  await Promise.all([
    User.findByIdAndUpdate(this.buyer, { $inc: { totalTrades: 1 } }),
    User.findByIdAndUpdate(this.seller, { $inc: { totalTrades: 1 } }),
  ]);

  // Mark listing as sold — removes it from public browse (getListings filters active only)
  const Listing = mongoose.model('Listing');
  await Listing.findByIdAndUpdate(this.listing, {
    status: 'sold',
    auctionMode: false, // clear auction mode so it doesn't appear in auction queries
  });

  return this;
};

// Request a return
transactionSchema.methods.requestReturn = function (reason) {
  if (!this.isReturnEligible) {
    throw new Error('Return window has expired or is not eligible');
  }

  this.returnPolicy.returnRequested = true;
  this.returnPolicy.returnReason = reason;
  this.status = 'disputed';

  return this;
};

// ─── Indexes ────────────────────────────────────────────────────────────────────
transactionSchema.index({ buyer: 1 });
transactionSchema.index({ seller: 1 });
transactionSchema.index({ listing: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// ─── Export ─────────────────────────────────────────────────────────────────────
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
module.exports.TRANSACTION_STATUSES = TRANSACTION_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
