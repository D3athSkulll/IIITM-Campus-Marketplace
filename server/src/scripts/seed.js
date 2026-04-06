/**
 * Seed Script — IIITM Campus Marketplace
 * Creates 5 dummy users (3 sellers, 2 buyers) + 15 realistic listings.
 *
 * Run: node src/scripts/seed.js
 * Or:  npm run seed
 *
 * All accounts use password: testpass123
 *
 * ACCOUNTS:
 *   seller1@iiitm.ac.in  — Aarav Singh (Heatblast42)   BH-1
 *   seller2@iiitm.ac.in  — Priya Sharma (Diamondhead7)  GH-1
 *   seller3@iiitm.ac.in  — Rohan Gupta (Swampfire11)    BH-3
 *   buyer1@iiitm.ac.in   — Sneha Patel (XLR8_99)        BH-2
 *   buyer2@iiitm.ac.in   — Mohit Verma (FourArms21)     New BH
 *
 * Images use Picsum Photos (free, no signup, consistent by seed).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');

// ── Picsum helper ─────────────────────────────────────────────────────────────
// Returns a stable, free image URL (same seed = same image always).
const img = (seed, w = 600, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// ── Seed Data ──────────────────────────────────────────────────────────────────

const USERS = [
  {
    email: 'seller1@iiitm.ac.in',
    passwordHash: 'testpass123',
    realName: 'Aarav Singh',
    anonymousNickname: 'Heatblast42',
    hostelBlock: 'BH-1',
    showRealIdentity: false,
    totalTrades: 7,
    ratingSum: 33,
    ratingCount: 7,
  },
  {
    email: 'seller2@iiitm.ac.in',
    passwordHash: 'testpass123',
    realName: 'Priya Sharma',
    anonymousNickname: 'Diamondhead7',
    hostelBlock: 'GH-1',
    showRealIdentity: true,
    totalTrades: 3,
    ratingSum: 13,
    ratingCount: 3,
  },
  {
    email: 'seller3@iiitm.ac.in',
    passwordHash: 'testpass123',
    realName: 'Rohan Gupta',
    anonymousNickname: 'Swampfire11',
    hostelBlock: 'BH-3',
    showRealIdentity: false,
    totalTrades: 0,
    ratingSum: 0,
    ratingCount: 0,
  },
  {
    email: 'buyer1@iiitm.ac.in',
    passwordHash: 'testpass123',
    realName: 'Sneha Patel',
    anonymousNickname: 'XLR8_99',
    hostelBlock: 'BH-2',
    showRealIdentity: false,
    totalTrades: 2,
    ratingSum: 9,
    ratingCount: 2,
  },
  {
    email: 'buyer2@iiitm.ac.in',
    passwordHash: 'testpass123',
    realName: 'Mohit Verma',
    anonymousNickname: 'FourArms21',
    hostelBlock: 'New BH',
    showRealIdentity: false,
    totalTrades: 1,
    ratingSum: 4,
    ratingCount: 1,
  },
];

// Listings are defined after we have user IDs, so we use a factory function.
const buildListings = (sellers) => [
  // ── Seller 1 (Heatblast42 / Aarav Singh) ───────────────────────────────────
  {
    seller: sellers[0]._id,
    title: 'Lenovo IdeaPad Gaming Laptop — i5 11th Gen, GTX 1650',
    description:
      'Used for 1 year. Excellent gaming performance, 8GB RAM, 512GB SSD. No scratches, charger included. Selling because I got a new one for placements. Perfect for DS/ML courses and late-night CS:GO sessions.',
    category: 'electronics',
    price: 42000,
    condition: 'good',
    images: [
      img('laptop-gaming-1', 800, 600),
      img('laptop-gaming-2', 800, 600),
      img('laptop-desk-setup', 800, 600),
    ],
    priceReferenceLink: 'https://www.amazon.in/s?k=lenovo+ideapad+gaming+laptop',
    viewCount: 87,
    interestCount: 4,
    shouldSuggestAuction: true,
  },
  {
    seller: sellers[0]._id,
    title: 'Bajaj 200mm Tower Fan — Works perfectly',
    description:
      'Essential for BH-1 summers. 3-speed settings, oscillation, silent night mode. Used 1 summer. Winters are over, selling before I graduate.',
    category: 'electronics',
    price: 900,
    condition: 'good',
    images: [img('tower-fan-room', 600, 600)],
    viewCount: 43,
    interestCount: 2,
  },
  {
    seller: sellers[0]._id,
    title: 'Prestige Induction Cooktop — 1500W',
    description:
      'Bought for late-night Maggi sessions. Works perfectly. Includes one bowl and ladle. Selling because hostel mess improved (finally). Great for heating milk, noodles, tea.',
    category: 'electronics',
    price: 750,
    condition: 'like-new',
    images: [img('induction-cooktop-kitchen', 600, 600)],
    viewCount: 61,
    interestCount: 5,
  },

  // ── Seller 2 (Diamondhead7 / Priya Sharma) ─────────────────────────────────
  {
    seller: sellers[1]._id,
    title: 'CLRS — Introduction to Algorithms (4th Edition)',
    description:
      'The algorithm bible. Used for ADA course. Some pencil highlights in Chapter 6 (Heapsort) and Chapter 22 (Graph Algorithms). All pages intact, no torn pages. Perfect condition for senior years.',
    category: 'books',
    price: 650,
    condition: 'fair',
    images: [
      img('algorithms-book-cover', 400, 600),
      img('algorithms-book-pages', 400, 600),
    ],
    priceReferenceLink: 'https://www.amazon.in/Introduction-Algorithms-3e-Thomas-Cormen/dp/0262033844',
    viewCount: 34,
    interestCount: 1,
  },
  {
    seller: sellers[1]._id,
    title: 'Data Communications & Networking — Forouzan (5th Ed)',
    description:
      'Used in Computer Networks course. Excellent condition, very few marks. Forouzan is the standard book for CN here. Includes my handwritten summary notes folded inside.',
    category: 'books',
    price: 380,
    condition: 'good',
    images: [img('networking-book-blue', 400, 600)],
    viewCount: 22,
    interestCount: 0,
  },
  {
    seller: sellers[1]._id,
    title: 'Ajazz AK33 Mechanical Keyboard — Blue switches',
    description:
      'Compact 82-key layout. Tactile clicky blue switches — satisfying to type on but LOUD (hostel neighbours will notice). USB-C detachable cable. White RGB backlight. Excellent for coding.',
    category: 'electronics',
    price: 2200,
    condition: 'like-new',
    images: [
      img('mechanical-keyboard-white', 800, 500),
      img('keyboard-rgb-closeup', 800, 500),
    ],
    viewCount: 56,
    interestCount: 3,
  },
  {
    seller: sellers[1]._id,
    title: 'Formal Shirt (M) — Arrow Brand, unused',
    description:
      'Bought for placement interviews, wore once. Light blue, full sleeve, Arrow brand. Size M fits up to 40 chest. Dry-cleaned and ironed. Perfect for SDE interviews.',
    category: 'clothing',
    price: 450,
    condition: 'like-new',
    images: [img('formal-shirt-blue-m', 500, 700)],
    viewCount: 19,
    interestCount: 0,
  },

  // ── Seller 3 (Swampfire11 / Rohan Gupta) ───────────────────────────────────
  {
    seller: sellers[2]._id,
    title: 'Foldable Study Chair with Cushion',
    description:
      'The chair that got me through all-nighters before exams. Ergonomic back support, armrests, height adjustable. Folds flat for easy storage. Cushion is firm, not saggy. Selling after graduation.',
    category: 'furniture',
    price: 1800,
    condition: 'good',
    images: [
      img('study-chair-blue', 600, 800),
      img('chair-folded-view', 600, 800),
    ],
    viewCount: 38,
    interestCount: 1,
  },
  {
    seller: sellers[2]._id,
    title: 'Sony WH-1000XM3 Noise Cancelling Headphones',
    description:
      'Premium ANC headphones. 30-hour battery life. Works great for library sessions and blocking out hostel noise. Minor scratch on the left cup (shown in photo). Original box + carry case included.',
    category: 'electronics',
    price: 8500,
    condition: 'fair',
    images: [
      img('sony-headphones-black', 700, 500),
      img('headphones-case-box', 700, 500),
    ],
    priceReferenceLink: 'https://www.amazon.in/Sony-WH-1000XM3-Wireless-Headphones-Alexa-enabled/dp/B07H8SR4NX',
    viewCount: 112,
    interestCount: 6,
  },
  {
    seller: sellers[2]._id,
    title: 'Casio fx-991ES PLUS Scientific Calculator',
    description:
      'The approved calculator for all IIITM exams. Used for 3 years. All functions working perfectly — natural display, 552 functions. Some wear on buttons but very functional. Essential for Maths + Physics.',
    category: 'stationery',
    price: 480,
    condition: 'fair',
    images: [img('casio-calculator-black', 400, 600)],
    viewCount: 29,
    interestCount: 0,
  },
  {
    seller: sellers[2]._id,
    title: 'Cycle — Hero Sprint 26T (City Speed)',
    description:
      'The campus is big, save your legs. Black Hero Sprint, 18-speed, working gears, disc brakes. Used for 2 years. Puncture repaired recently. Tyres in good shape. Perfect for going off-campus to Gwalior city.',
    category: 'other',
    price: 3200,
    condition: 'fair',
    images: [
      img('bicycle-hero-black', 700, 500),
      img('cycle-campus-path', 700, 500),
    ],
    viewCount: 74,
    interestCount: 2,
  },
  {
    seller: sellers[2]._id,
    title: 'SG Cricket Bat — English Willow, Grade 3',
    description:
      'Great bat for hostel ground cricket. Full-size, proper grain count. Minor damage on face (cosmetic only, does not affect play). Grip replaced last month. Includes cover.',
    category: 'sports',
    price: 700,
    condition: 'good',
    images: [img('cricket-bat-willow', 400, 700)],
    viewCount: 17,
    interestCount: 0,
  },
  {
    seller: sellers[2]._id,
    title: 'Lab Coat (L) — White, Cotton',
    description:
      'Used for Chemistry lab sessions. Washed and clean. Size L. Button closure, two pockets. Useful for Physics/Chemistry labs in 1st year. Don\'t buy new when you can get it cheap.',
    category: 'clothing',
    price: 180,
    condition: 'good',
    images: [img('lab-coat-white-l', 500, 700)],
    viewCount: 11,
    interestCount: 0,
  },
  {
    seller: sellers[0]._id,
    listingType: 'rent',
    title: 'Formal Blazer (M/L) — Available for Placement Season',
    description:
      'Navy blue formal blazer. Fits M-L. Perfect for Day 1 placements, GDs, and campus interviews. Dry-cleaned and pressed. Rent instead of buying something you\'ll wear twice.',
    category: 'clothing',
    price: 3500,
    condition: 'like-new',
    images: [img('navy-blazer-formal', 500, 700)],
    rentalDetails: {
      pricePerDay: 150,
      depositAmount: 500,
      maxRentalDays: 7,
    },
    viewCount: 45,
    interestCount: 3,
  },
  {
    seller: sellers[1]._id,
    listingType: 'rent',
    title: 'Pressure Cooker 3L — Rent for Trips & Events',
    description:
      'Hawkins 3-litre pressure cooker. Perfect for batch cooking during trips, annual day prep, or hostel fests. Comes with lid, gasket is new. Return in clean condition.',
    category: 'other',
    price: 1200,
    condition: 'good',
    images: [img('pressure-cooker-silver', 600, 600)],
    rentalDetails: {
      pricePerDay: 50,
      depositAmount: 300,
      maxRentalDays: 5,
    },
    viewCount: 8,
    interestCount: 0,
  },
];

// ── Main Seed Function ──────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Wipe only seed accounts (by email) and their listings
    const seedEmails = USERS.map((u) => u.email);
    const existingUsers = await User.find({ email: { $in: seedEmails } });
    const existingIds = existingUsers.map((u) => u._id);

    if (existingUsers.length > 0) {
      console.log(`♻️  Removing ${existingUsers.length} existing seed user(s) and their listings…`);
      await Listing.deleteMany({ seller: { $in: existingIds } });
      await User.deleteMany({ _id: { $in: existingIds } });
    }

    // Create users (pre-save hook hashes passwords + sets alien avatars)
    console.log('👥 Creating users…');
    const createdUsers = [];
    for (const userData of USERS) {
      const u = new User(userData);
      await u.save();
      createdUsers.push(u);
      console.log(`   ✓ ${u.email} → ${u.anonymousNickname} (${u.realName})`);
    }

    // Sellers = first 3 users
    const sellers = createdUsers.slice(0, 3);

    // Create listings
    console.log('\n📦 Creating listings…');
    const listings = buildListings(sellers);
    let count = 0;
    for (const listingData of listings) {
      const l = new Listing(listingData);
      await l.save();
      count++;
      console.log(`   ✓ ${l.title.slice(0, 60)}…`);
    }

    console.log(`\n🎉 Seed complete! ${createdUsers.length} users, ${count} listings.\n`);
    console.log('─'.repeat(60));
    console.log('LOGIN CREDENTIALS (password for all: testpass123)');
    console.log('─'.repeat(60));
    console.log('SELLERS:');
    createdUsers.slice(0, 3).forEach((u) =>
      console.log(`  ${u.email}  →  ${u.anonymousNickname}  (${u.realName}, ${u.hostelBlock})`)
    );
    console.log('\nBUYERS:');
    createdUsers.slice(3).forEach((u) =>
      console.log(`  ${u.email}  →  ${u.anonymousNickname}  (${u.realName}, ${u.hostelBlock})`)
    );
    console.log('─'.repeat(60));
    console.log('\nOpen http://localhost:3000 to explore the marketplace!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    if (err.errors) {
      Object.entries(err.errors).forEach(([field, e]) =>
        console.error(`   ${field}: ${e.message}`)
      );
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
