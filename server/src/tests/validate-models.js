/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  Campus Marketplace — Phase 1 Validation Script
 * ═══════════════════════════════════════════════════════════════════════════════
 *  Tests all Mongoose models for correct validation, virtuals, and methods.
 *  Run: node src/tests/validate-models.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Listing, BuyerDemand, Chat, Transaction, Rating } = require('../models');

// ─── Helpers ────────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function expectValidationError(Model, data, testName) {
  try {
    const doc = new Model(data);
    await doc.validate();
    console.log(`  [FAIL] ${testName} (expected validation error, got none)`);
    failed++;
  } catch (err) {
    if (err.name === 'ValidationError') {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.log(`  [FAIL] ${testName} (unexpected error: ${err.message})`);
      failed++;
    }
  }
}

// ─── Test Suite ─────────────────────────────────────────────────────────────────
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Campus Marketplace — Model Validation Tests     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Connect to test database
  const testURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-marketplace-test';
  try {
    await mongoose.connect(testURI);
    console.log(`Connected to: ${testURI}\n`);
  } catch (err) {
    console.log(`Warning: Could not connect to MongoDB (${err.message}).`);
    console.log('   Running validation-only tests (no DB writes)...\n');
  }

  // ── USER MODEL ──────────────────────────────────────────────────────────────
  console.log('━━━ 1. User Model ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Should reject non-@iiitm.ac.in emails
  await expectValidationError(User, {
    email: 'user@gmail.com',
    passwordHash: 'test123',
    realName: 'Test User',
  }, 'Reject non-@iiitm.ac.in email');

  // Should accept valid @iiitm.ac.in email
  const validUser = new User({
    email: 'student@iiitm.ac.in',
    passwordHash: 'securePassword123',
    realName: 'Shiva Kumar',
    hostelBlock: 'BH-1',
  });
  try {
    await validUser.validate();
    assert(true, 'Accept valid @iiitm.ac.in email');
  } catch {
    assert(false, 'Accept valid @iiitm.ac.in email');
  }

  // Should auto-generate anonymous nickname
  assert(
    validUser.anonymousNickname && validUser.anonymousNickname.length > 0,
    'Auto-generate anonymous nickname'
  );
  console.log(`     -> Generated nickname: "${validUser.anonymousNickname}"`);

  // Should default to anonymous display
  assert(validUser.showRealIdentity === false, 'Default showRealIdentity is false');

  // Display name should show nickname by default
  assert(
    validUser.displayName === validUser.anonymousNickname,
    'displayName shows nickname when anonymous'
  );

  // Display name should show real name when opted in
  validUser.showRealIdentity = true;
  assert(validUser.displayName === 'Shiva Kumar', 'displayName shows real name when opted in');

  // Rating visibility: should be hidden with 0 trades
  assert(validUser.isRatingVisible === false, 'Rating hidden with 0 trades');
  assert(validUser.tradesUntilRatingVisible === 5, 'Shows 5 trades until visible');

  // Rating visibility: should be visible with 5+ trades
  validUser.totalTrades = 5;
  assert(validUser.isRatingVisible === true, 'Rating visible with 5 trades');
  assert(validUser.tradesUntilRatingVisible === 0, 'Shows 0 trades until visible');

  // Average rating calculation
  validUser.ratingSum = 22;
  validUser.ratingCount = 5;
  assert(validUser.averageRating === 4.4, 'Average rating calculates correctly (22/5 = 4.4)');

  // Should reject invalid hostel block
  await expectValidationError(User, {
    email: 'test2@iiitm.ac.in',
    passwordHash: 'test123',
    realName: 'Test',
    hostelBlock: 'InvalidBlock',
  }, 'Reject invalid hostel block');

  console.log('');

  // ── LISTING MODEL ───────────────────────────────────────────────────────────
  console.log('━━━ 2. Listing Model ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const sellerId = new mongoose.Types.ObjectId();

  // Valid listing
  const validListing = new Listing({
    seller: sellerId,
    title: 'Data Structures Textbook - Cormen',
    description: 'CLRS 3rd Edition, highlights on first 3 chapters only. Very good condition.',
    category: 'books',
    price: 350,
    condition: 'good',
    images: ['https://example.com/img1.jpg'],
  });
  try {
    await validListing.validate();
    assert(true, 'Accept valid listing with all required fields');
  } catch (e) {
    assert(false, `Accept valid listing: ${e.message}`);
  }

  // Should reject invalid category
  await expectValidationError(Listing, {
    seller: sellerId,
    title: 'Test',
    description: 'Test desc',
    category: 'invalid-category',
    price: 100,
    condition: 'good',
    images: ['img.jpg'],
  }, 'Reject invalid category');

  // Should reject no images
  await expectValidationError(Listing, {
    seller: sellerId,
    title: 'Test',
    description: 'Test desc',
    category: 'books',
    price: 100,
    condition: 'good',
    images: [],
  }, 'Reject listing with 0 images');

  // Should reject more than 5 images
  await expectValidationError(Listing, {
    seller: sellerId,
    title: 'Test',
    description: 'Test desc',
    category: 'books',
    price: 100,
    condition: 'good',
    images: ['1', '2', '3', '4', '5', '6'],
  }, 'Reject listing with 6 images');

  // Auction mode suggestion virtual
  validListing.interestCount = 2;
  assert(validListing.shouldSuggestAuction === true, 'Suggest auction when interestCount >= 2');

  validListing.interestCount = 0;
  validListing.auctionRequestedBy = [new mongoose.Types.ObjectId()];
  assert(validListing.shouldSuggestAuction === true, 'Suggest auction when a buyer explicitly requests auction mode');

  validListing.auctionMode = true;
  assert(validListing.shouldSuggestAuction === false, 'Do not suggest auction when already in auction mode');

  console.log('');

  // ── BUYER DEMAND MODEL ──────────────────────────────────────────────────────
  console.log('━━━ 3. BuyerDemand Model ━━━━━━━━━━━━━━━━━━━━━━━━');

  const buyerId = new mongoose.Types.ObjectId();

  const validDemand = new BuyerDemand({
    buyer: buyerId,
    title: 'Looking for a 2nd-hand calculator',
    category: 'electronics',
    budgetMin: 200,
    budgetMax: 500,
  });
  try {
    await validDemand.validate();
    assert(true, 'Accept valid buyer demand');
  } catch {
    assert(false, 'Accept valid buyer demand');
  }

  // Budget range virtual
  assert(validDemand.budgetRange === '₹200 - ₹500', 'Budget range displays correctly');

  // Expiry default
  const daysDiff = Math.round((validDemand.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
  assert(daysDiff >= 29 && daysDiff <= 31, 'Auto-expire set to ~30 days');

  // budgetMax must be >= budgetMin
  await expectValidationError(BuyerDemand, {
    buyer: buyerId,
    title: 'Test',
    category: 'books',
    budgetMin: 500,
    budgetMax: 200,
  }, 'Reject budgetMax < budgetMin');

  console.log('');

  // ── CHAT MODEL ──────────────────────────────────────────────────────────────
  console.log('━━━ 4. Chat Model (Negotiation Engine) ━━━━━━━━━━');

  const listingId = new mongoose.Types.ObjectId();
  const buyer2Id = new mongoose.Types.ObjectId();
  const seller2Id = new mongoose.Types.ObjectId();

  const chat = new Chat({
    listing: listingId,
    buyer: buyer2Id,
    seller: seller2Id,
    mode: 'normal',
  });

  try {
    await chat.validate();
    assert(true, 'Accept valid chat');
  } catch {
    assert(false, 'Accept valid chat');
  }

  // Start negotiation
  chat.startNegotiation();
  assert(chat.mode === 'negotiation', 'Mode changes to negotiation');
  assert(chat.negotiation !== null, 'Negotiation sub-document created');
  assert(chat.negotiation.maxRounds === 3, 'Max rounds is 3');
  assert(chat.cardsRemaining === 3, 'Cards remaining is 3');
  assert(chat.messages.length === 1, 'System message added on negotiation start');

  // Submit offer round 1
  chat.submitOffer(250);
  assert(chat.negotiation.offers.length === 1, 'Round 1 offer submitted');
  assert(chat.negotiation.offers[0].amount === 250, 'Offer amount is 250');
  assert(chat.cardsRemaining === 2, 'Cards remaining is 2 after first offer');

  // Reject round 1
  chat.respondToOffer(false);
  assert(chat.negotiation.offers[0].status === 'rejected', 'Round 1 offer rejected');
  assert(chat.status === 'active', 'Chat still active after rejection with cards left');

  // Submit offer round 2
  chat.submitOffer(200);
  assert(chat.negotiation.offers.length === 2, 'Round 2 offer submitted');
  assert(chat.cardsRemaining === 1, 'Cards remaining is 1');

  // Accept round 2
  chat.respondToOffer(true);
  assert(chat.negotiation.outcome === 'accepted', 'Negotiation outcome is accepted');
  assert(chat.negotiation.agreedPrice === 200, 'Agreed price is 200');
  assert(chat.status === 'completed', 'Chat status is completed after acceptance');

  // Test exhausting all cards
  const chat2 = new Chat({
    listing: listingId,
    buyer: buyer2Id,
    seller: seller2Id,
    mode: 'normal',
  });
  chat2.startNegotiation();
  chat2.submitOffer(300);
  chat2.respondToOffer(false);
  chat2.submitOffer(200);
  chat2.respondToOffer(false);
  chat2.submitOffer(100);
  chat2.respondToOffer(false);
  assert(chat2.negotiation.outcome === 'rejected', 'Negotiation fails when all cards used');
  assert(chat2.status === 'failed', 'Chat status failed when all cards exhausted');
  assert(chat2.cardsRemaining === 0, 'Cards remaining is 0');

  // Test quick replies exist
  const { QUICK_REPLIES } = require('../models/Chat');
  assert(QUICK_REPLIES.buyer.length > 0, 'Buyer quick replies defined');
  assert(QUICK_REPLIES.seller.length > 0, 'Seller quick replies defined');

  console.log('');

  // ── TRANSACTION MODEL ──────────────────────────────────────────────────────
  console.log('━━━ 5. Transaction Model ━━━━━━━━━━━━━━━━━━━━━━━━');

  const chatId = new mongoose.Types.ObjectId();

  const txn = new Transaction({
    listing: listingId,
    buyer: buyer2Id,
    seller: seller2Id,
    chat: chatId,
    agreedPrice: 300,
  });

  try {
    await txn.validate();
    assert(true, 'Accept valid transaction');
  } catch {
    assert(false, 'Accept valid transaction');
  }

  assert(txn.buyerConfirmed === false, 'Buyer not confirmed initially');
  assert(txn.sellerConfirmed === false, 'Seller not confirmed initially');
  assert(txn.status === 'pending-confirmation', 'Status is pending-confirmation');
  assert(txn.isReturnEligible === true, 'Return eligible within 2-day window');

  // Buyer confirms
  txn.confirm(buyer2Id);
  assert(txn.buyerConfirmed === true, 'Buyer confirmed');
  assert(txn.status === 'pending-confirmation', 'Status still pending after one confirmation');

  // Seller confirms
  txn.confirm(seller2Id);
  assert(txn.sellerConfirmed === true, 'Seller confirmed');
  assert(txn.status === 'confirmed', 'Status changes to confirmed after both confirm');
  assert(txn.isFullyConfirmed === true, 'isFullyConfirmed is true');

  console.log('');

  // ── RATING MODEL ────────────────────────────────────────────────────────────
  console.log('━━━ 6. Rating Model ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const txnId = new mongoose.Types.ObjectId();

  const validRating = new Rating({
    transaction: txnId,
    rater: buyer2Id,
    ratee: seller2Id,
    score: 4,
    comment: 'Great deal, smooth negotiation!',
  });

  try {
    await validRating.validate();
    assert(true, 'Accept valid rating');
  } catch {
    assert(false, 'Accept valid rating');
  }

  // Score must be 1-5
  await expectValidationError(Rating, {
    transaction: txnId,
    rater: buyer2Id,
    ratee: seller2Id,
    score: 0,
  }, 'Reject rating score of 0');

  await expectValidationError(Rating, {
    transaction: txnId,
    rater: buyer2Id,
    ratee: seller2Id,
    score: 6,
  }, 'Reject rating score of 6');

  await expectValidationError(Rating, {
    transaction: txnId,
    rater: buyer2Id,
    ratee: seller2Id,
    score: 3.5,
  }, 'Reject non-integer rating score');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed} passed, ${failed} failed                    ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (failed === 0) {
    console.log('All model validations passed. Phase 1 is complete.\n');
  } else {
    console.log(`Warning: ${failed} test(s) failed. Please review above.\n`);
  }

  // Disconnect
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// ─── Run ────────────────────────────────────────────────────────────────────────
runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
