const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Nickname Generator ────────────────────────────────────────────────────────
const adjectives = [
  'Swift', 'Brave', 'Silent', 'Clever', 'Mystic', 'Bold', 'Calm', 'Witty',
  'Lucky', 'Noble', 'Fierce', 'Bright', 'Quick', 'Sly', 'Cool', 'Sharp',
  'Wise', 'Grand', 'Keen', 'Vivid', 'Gentle', 'Daring', 'Nimble', 'Stealthy',
  'Radiant', 'Cosmic', 'Electric', 'Phantom', 'Turbo', 'Sonic'
];

const animals = [
  'Falcon', 'Owl', 'Wolf', 'Fox', 'Hawk', 'Bear', 'Tiger', 'Eagle',
  'Panther', 'Dolphin', 'Raven', 'Cobra', 'Dragon', 'Phoenix', 'Lion',
  'Shark', 'Lynx', 'Jaguar', 'Puma', 'Orca', 'Viper', 'Mantis',
  'Stallion', 'Griffin', 'Kraken', 'Pegasus', 'Sparrow', 'Leopard'
];

function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${animal}${num}`;
}

// ─── Hostel Block Enum ──────────────────────────────────────────────────────────
// ABV-IIITM Gwalior hostel blocks
const HOSTEL_BLOCKS = [
  'BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5',
  'GH-1', 'GH-2',
  'New BH', 'Day Scholar'
];

// ─── User Schema ────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9._%+-]+@iiitm\.ac\.in$/.test(v);
        },
        message: 'Only @iiitm.ac.in email addresses are allowed',
      },
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },

    realName: {
      type: String,
      required: [true, 'Real name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    anonymousNickname: {
      type: String,
      unique: true,
      default: generateNickname,
    },

    showRealIdentity: {
      type: Boolean,
      default: false,
    },

    hostelBlock: {
      type: String,
      enum: {
        values: HOSTEL_BLOCKS,
        message: '{VALUE} is not a valid hostel block',
      },
    },

    avatarUrl: {
      type: String,
      default: '',
    },

    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },

    // ── Trust & Rating Aggregates ─────────────────────────────────────────────
    totalTrades: {
      type: Number,
      default: 0,
      min: 0,
    },

    ratingSum: {
      type: Number,
      default: 0,
      min: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ───────────────────────────────────────────────────────────────────

// Rating is visible only after 5+ completed trades
userSchema.virtual('isRatingVisible').get(function () {
  return this.totalTrades >= 5;
});

// Average rating (only meaningful when ratingCount > 0)
userSchema.virtual('averageRating').get(function () {
  if (this.ratingCount === 0) return 0;
  return Math.round((this.ratingSum / this.ratingCount) * 10) / 10; // 1 decimal
});

// Display name based on identity preference
userSchema.virtual('displayName').get(function () {
  return this.showRealIdentity ? this.realName : this.anonymousNickname;
});

// Trades remaining to unlock rating visibility
userSchema.virtual('tradesUntilRatingVisible').get(function () {
  return Math.max(0, 5 - this.totalTrades);
});

// ─── Pre-save Hooks ─────────────────────────────────────────────────────────────

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Ensure unique nickname on save (retry if collision)
userSchema.pre('save', async function () {
  if (!this.isNew) return;

  let attempts = 0;
  while (attempts < 10) {
    const existing = await this.constructor.findOne({
      anonymousNickname: this.anonymousNickname,
    });
    if (!existing) break;
    this.anonymousNickname = generateNickname();
    attempts++;
  }
});

// ─── Instance Methods ───────────────────────────────────────────────────────────

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Return safe public profile (hides sensitive fields)
userSchema.methods.toPublicProfile = function () {
  const profile = {
    _id: this._id,
    displayName: this.displayName,
    hostelBlock: this.hostelBlock,
    avatarUrl: this.avatarUrl,
    totalTrades: this.totalTrades,
    createdAt: this.createdAt,
  };

  // Only include rating if the user has enough trades
  if (this.isRatingVisible) {
    profile.averageRating = this.averageRating;
    profile.ratingCount = this.ratingCount;
  } else {
    profile.ratingLocked = true;
    profile.tradesUntilRatingVisible = this.tradesUntilRatingVisible;
  }

  return profile;
};

// ─── Indexes ────────────────────────────────────────────────────────────────────
userSchema.index({ hostelBlock: 1 });

// ─── Export ─────────────────────────────────────────────────────────────────────
const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.HOSTEL_BLOCKS = HOSTEL_BLOCKS;
module.exports.generateNickname = generateNickname;
