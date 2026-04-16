/**
 * seed-demo.js — Comprehensive seed script for IIITM Campus Marketplace demo
 * Populates real users, listings, chats, bargaining, auctions, transactions
 * Run: cd server && node seed-demo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Listing = require('./src/models/Listing');
const Chat = require('./src/models/Chat');
const Transaction = require('./src/models/Transaction');
const BuyerDemand = require('./src/models/BuyerDemand');
const { generateNickname, getDefaultAvatar } = require('./src/models/User');

// ─── Image URLs (uploaded to imgbb) ─────────────────────────────────────────
const IMG = {
  decorationGlobe: 'https://i.ibb.co/4RqhdzcD/decoration-globe.jpg',
  digitalClock: 'https://i.ibb.co/6q50bmx/digital-clock.jpg',
  foamCleaner: 'https://i.ibb.co/750vwSw/foam-cleaner-shoes-fabric.jpg',
  hairSerum1: 'https://i.ibb.co/VYSGjq5Z/inbuilt-10f-hair-serum.jpg',
  hairSerum2: 'https://i.ibb.co/W4r9yjLq/inbuild-10f-hair-serum-2.jpg',
  cooler: 'https://i.ibb.co/B5xVLQ5C/kenstar-cooler.jpg',
  controller: 'https://i.ibb.co/ZpZhzGSV/kreo-controller.jpg',
  keyboard: 'https://i.ibb.co/B2Pwj4VD/kreo-keyboard.jpg',
  namkeenBack: 'https://i.ibb.co/0VvjnDNh/nakoda-namkeen-back.jpg',
  namkeenFront: 'https://i.ibb.co/9m32WMyH/nakoda-namkeen-front.jpg',
  pastaBack: 'https://i.ibb.co/NdrNBhYK/pasta-back.jpg',
  pastaFront: 'https://i.ibb.co/VWQsrf8Z/pasta-front.jpg',
  trimmer1: 'https://i.ibb.co/cXhDh2vx/trimmer-1.jpg',
  trimmer2: 'https://i.ibb.co/chqsgbXY/trimmer-2.jpg',
  trimmer3: 'https://i.ibb.co/whdM0hGX/trimmer-3-box.jpg',
};

// ─── Reference Links ─────────────────────────────────────────────────────────
const REF = {
  controller: 'https://kreo-tech.com/products/surge-xb-wireless-gaming-controller',
  keyboard: 'https://www.amazon.in/dp/B0CHJDY8S1',
  pasta: 'https://blinkit.com/prn/maggi-cheese-macaroni-instant-pasta/prid/82341',
  clock: 'https://amazon.in/AERYS-Digital-Corporate-Temperature-Black-Centimeters/dp/B0CQH5N1DY',
  cooler: 'https://www.flipkart.com/kenstar-45-l-room-personal-air-cooler/p/itm613e0be616277',
};

// ─── Helper: hash password ─────────────────────────────────────────────────
async function hashPwd(pwd) {
  return bcrypt.hash(pwd, 12);
}

// ─── Helper: make a message object ─────────────────────────────────────────
function msg(senderId, content, type = 'text', minsAgo = 0) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minsAgo);
  return { sender: senderId, type, content, createdAt: d, updatedAt: d };
}

function offerMsg(senderId, amount, minsAgo = 0) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minsAgo);
  return { sender: senderId, type: 'offer', content: `Offer: ₹${amount}`, offerAmount: amount, createdAt: d, updatedAt: d };
}

function sysMsg(content, minsAgo = 0) {
  // System messages still need a sender ObjectId; we'll set it after creating users
  const d = new Date();
  d.setMinutes(d.getMinutes() - minsAgo);
  return { type: 'system', content, createdAt: d, updatedAt: d };
}

// ─── Helper: random date in past N days ─────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8); // 8am-8pm
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ─── Clean existing demo data (be careful — only clean users we're about to create) ──
  const demoEmails = [
    'imt_2024060@iiitm.ac.in', 'imt_2024054@iiitm.ac.in',
    'nishantsolanki0704@iiitm.ac.in', 'darshan0407@iiitm.ac.in',
    'taksh2023@iiitm.ac.in', 'udit2023@iiitm.ac.in',
    'img_2022003@iiitm.ac.in', 'img_2022032@iiitm.ac.in',
    'prasanna2023@iiitm.ac.in',
  ];
  // Note: Nishant & Darshan don't have @iiitm.ac.in emails (gmail), so we create @iiitm.ac.in equivalents

  const existingUsers = await User.find({ email: { $in: demoEmails } });
  const existingIds = existingUsers.map(u => u._id);
  if (existingIds.length > 0) {
    console.log(`Cleaning ${existingIds.length} existing demo users and related data...`);
    await Chat.deleteMany({ $or: [{ buyer: { $in: existingIds } }, { seller: { $in: existingIds } }] });
    await Transaction.deleteMany({ $or: [{ buyer: { $in: existingIds } }, { seller: { $in: existingIds } }] });
    await Listing.deleteMany({ seller: { $in: existingIds } });
    await BuyerDemand.deleteMany({ buyer: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });
  }

  // ─── Create Users ────────────────────────────────────────────────────────────
  console.log('Creating users...');
  const users = {};

  const userData = [
    { key: 'pinkesh',  email: 'imt_2024060@iiitm.ac.in',        realName: 'Pinkesh Kumar Verma', phone: '6265733380', hostel: 'BH-2', pwd: 'pinkesh',  showReal: false },
    { key: 'neeraj',   email: 'imt_2024054@iiitm.ac.in',        realName: 'Neeraj Kumar Ram',    phone: '9098283432', hostel: 'BH-2', pwd: 'neeraj',   showReal: true },
    { key: 'nishant',  email: 'nishantsolanki0704@iiitm.ac.in',  realName: 'Nishant Solanki',     phone: '8103123958', hostel: 'IVH',  pwd: 'nishant',  showReal: true },
    { key: 'darshan',  email: 'darshan0407@iiitm.ac.in',         realName: 'Darshan',             phone: '7819061740', hostel: 'IVH',  pwd: 'darshan',  showReal: false },
    { key: 'taksh',    email: 'taksh2023@iiitm.ac.in',           realName: 'Taksh',               phone: '9136883228', hostel: 'BH-3', pwd: 'taksh',    showReal: true },
    { key: 'udit',     email: 'udit2023@iiitm.ac.in',            realName: 'Udit Srivastava',     phone: '7000650042', hostel: 'BH-3', pwd: 'udit',     showReal: true },
    { key: 'abhinav',  email: 'img_2022003@iiitm.ac.in',         realName: 'Abhinav Sharma',      phone: '9479960041', hostel: 'BH-3', pwd: 'abhinav',  showReal: true },
    { key: 'kunal',    email: 'img_2022032@iiitm.ac.in',         realName: 'Kunal Vardani',       phone: '9929646997', hostel: 'BH-3', pwd: 'kunal',    showReal: false },
    { key: 'prasanna', email: 'prasanna2023@iiitm.ac.in',        realName: 'Prasanna Mishra',     phone: '9506287890', hostel: 'BH-3', pwd: 'prasanna', showReal: true },
  ];

  for (const u of userData) {
    const nick = generateNickname();
    const avatarUrl = getDefaultAvatar(nick);
    const user = new User({
      email: u.email,
      passwordHash: await hashPwd(u.pwd),
      realName: u.realName,
      phone: u.phone,
      anonymousNickname: nick,
      avatarUrl,
      showRealIdentity: u.showReal,
      hostelBlock: u.hostel,
      securityQuestion: 'What is the name of your pet?',
      securityAnswer: 'tom',
    });
    // Skip pre-save hooks for password (already hashed) by directly saving
    await user.save({ validateBeforeSave: true });
    users[u.key] = user;
    console.log(`  ✓ ${u.realName} (${u.email}) — pw: ${u.pwd} — nick: ${nick}`);
  }

  // ─── Create Listings ─────────────────────────────────────────────────────────
  console.log('\nCreating listings...');

  const listings = {};

  // Product assignments:
  // Udit: Cooler (3500, rent), Kreo Keyboard (2000), Kreo Controller (1600)
  // Abhinav: Trimmer (250), Hair Serum (700)
  // Kunal: Digital Clock (200), Decoration Globe (120)
  // Prasanna: Pasta (25)
  // Taksh: Shoe Foam Cleaner (300)
  // Neeraj: Nakoda Namkeen (120)

  const listingData = [
    {
      key: 'cooler', seller: 'udit',
      title: 'Kenstar 45L Room Cooler — barely used',
      description: 'Kenstar cooler, bought last summer, used only 2 months. Shifting to AC room so dont need it. Works perfectly, good cooling. Pick up from BH-3.',
      category: 'electronics', price: 3500, condition: 'good',
      images: [IMG.cooler],
      priceReferenceLink: REF.cooler,
      listingType: 'rent',
      rentalDetails: { pricePerDay: 80, depositAmount: 1000, maxRentalDays: 30 },
      daysAgo: 8,
    },
    {
      key: 'keyboard', seller: 'udit',
      title: 'Kreo Surge Wireless Gaming Keyboard',
      description: 'Kreo gaming keyboard, RGB, wireless+wired both. Used 6 months, all keys working. Selling bcoz got new mechanical one. Original box included.',
      category: 'electronics', price: 2000, condition: 'good',
      images: [IMG.keyboard],
      priceReferenceLink: REF.keyboard,
      daysAgo: 6,
    },
    {
      key: 'controller', seller: 'udit',
      title: 'Kreo Surge XB Wireless Gaming Controller',
      description: 'Gaming controller, works with PC and mobile both. Bluetooth + USB. Only 4 months old, selling bcoz i dont play much anymore. No drift issues.',
      category: 'electronics', price: 1600, condition: 'like-new',
      images: [IMG.controller],
      priceReferenceLink: REF.controller,
      daysAgo: 5,
    },
    {
      key: 'trimmer', seller: 'abhinav',
      title: 'Nova Trimmer — full kit with box',
      description: 'Trimmer, barely used. Bought extra one by mistake on sale. All attachments included, original box. Battery backup 60min+.',
      category: 'electronics', price: 250, condition: 'like-new',
      images: [IMG.trimmer1, IMG.trimmer2, IMG.trimmer3],
      daysAgo: 7,
    },
    {
      key: 'serum', seller: 'abhinav',
      title: 'Inbily 10F Hair Serum — sealed',
      description: 'Hair serum, bought 2 bottles, selling extra one. Sealed pack, MRP 900. Good for frizzy hair. Pick up BH-3 anytime.',
      category: 'accessories', price: 700, condition: 'like-new',
      images: [IMG.hairSerum1, IMG.hairSerum2],
      daysAgo: 4,
    },
    {
      key: 'clock', seller: 'kunal',
      title: 'Digital LED Clock — temperature display',
      description: 'Aesthetic digital clock, shows time + temperature. USB powered, looks sick on desk. Selling bcoz room already has wall clock.',
      category: 'electronics', price: 200, condition: 'good',
      images: [IMG.digitalClock],
      priceReferenceLink: REF.clock,
      daysAgo: 10,
    },
    {
      key: 'globe', seller: 'kunal',
      title: 'Globe Decoration Lamp — room decor',
      description: 'Decorative globe lamp, night light. Looks good in room, works fine. Just redecorating so selling this one. Pick up BH-3.',
      category: 'furniture', price: 120, condition: 'fair',
      images: [IMG.decorationGlobe],
      daysAgo: 9,
    },
    {
      key: 'pasta', seller: 'prasanna',
      title: 'Maggi Cheese Pasta — new packet',
      description: 'Maggi cheese macaroni pasta, sealed. Bought extra, have 2 packets dont need. Expiry far off. ₹25 only.',
      category: 'other', price: 25, condition: 'like-new',
      images: [IMG.pastaFront, IMG.pastaBack],
      priceReferenceLink: REF.pasta,
      daysAgo: 3,
    },
    {
      key: 'foam', seller: 'taksh',
      title: 'Shoe Foam Cleaner — fabric & leather',
      description: 'Shoe cleaning foam, used once on my white shoes. Works on fabric, leather, canvas. Almost full bottle left. Selling cheap.',
      category: 'accessories', price: 300, condition: 'good',
      images: [IMG.foamCleaner],
      daysAgo: 5,
    },
    {
      key: 'namkeen', seller: 'neeraj',
      title: 'Nakoda Namkeen Mixture — home snack',
      description: 'Nakoda namkeen, bought from home. Ghar ka namkeen, tastes amazing. 500g packet, sealed. Selling bcoz got too much from home lol.',
      category: 'other', price: 120, condition: 'like-new',
      images: [IMG.namkeenFront, IMG.namkeenBack],
      daysAgo: 6,
    },
  ];

  for (const l of listingData) {
    const createdAt = daysAgo(l.daysAgo);
    const listing = new Listing({
      seller: users[l.seller]._id,
      title: l.title,
      description: l.description,
      category: l.category,
      price: l.price,
      condition: l.condition,
      images: l.images,
      priceReferenceLink: l.priceReferenceLink || undefined,
      listingType: l.listingType || 'sell',
      rentalDetails: l.rentalDetails || undefined,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });
    await listing.save();
    listings[l.key] = listing;
    console.log(`  ✓ ${l.title} — ₹${l.price} by ${l.seller}`);
  }

  // ─── Setup Auction for Cooler ─────────────────────────────────────────────────
  console.log('\nSetting up auction for cooler...');
  const coolerListing = listings.cooler;
  coolerListing.auctionMode = true;
  coolerListing.auctionDeposit = 500;
  coolerListing.auctionMinBid = 2000;
  coolerListing.auctionMaxBid = 4000;
  coolerListing.interestCount = 4;
  coolerListing.interestedUsers = [users.pinkesh._id, users.nishant._id, users.darshan._id, users.kunal._id];
  coolerListing.auctionBids = [
    { bidder: users.pinkesh._id, amount: 2000, showBidderName: false, createdAt: daysAgo(5) },
    { bidder: users.nishant._id, amount: 2100, showBidderName: true, createdAt: daysAgo(4) },
    { bidder: users.darshan._id, amount: 2200, showBidderName: false, createdAt: daysAgo(3) },
  ];
  await coolerListing.save();
  console.log('  ✓ Cooler auction: 3 bids, current highest ₹2200');

  // Also set interest on keyboard
  listings.keyboard.interestCount = 2;
  listings.keyboard.interestedUsers = [users.abhinav._id, users.kunal._id];
  await listings.keyboard.save();

  // ─── Create Buyer Demands ─────────────────────────────────────────────────────
  console.log('\nCreating buyer demands...');

  const demands = [
    { buyer: 'pinkesh', title: 'Looking for room cooler', desc: 'Need a cooler urgently, summer aa gaya. Budget 2-3k, any brand chalega', category: 'electronics', min: 2000, max: 3500 },
    { buyer: 'nishant', title: 'Need old textbooks — DSA, DBMS', desc: 'First year ho, seniors ke books chahiye. DSA aur DBMS preferably. Budget flexible.', category: 'books', min: 100, max: 500 },
    { buyer: 'darshan', title: 'Looking for study lamp', desc: 'Need a decent table lamp for hostel room. LED wala chahiye', category: 'electronics', min: 200, max: 800 },
    { buyer: 'kunal', title: 'Want instant food packets', desc: 'Maggi, pasta, anything instant. Hostel mess se pak gaya. Bulk me bhi le lunga', category: 'other', min: 10, max: 200 },
  ];

  for (const d of demands) {
    const demand = new BuyerDemand({
      buyer: users[d.buyer]._id,
      title: d.title,
      description: d.desc,
      category: d.category,
      budgetMin: d.min,
      budgetMax: d.max,
      status: 'open',
      createdAt: daysAgo(Math.floor(Math.random() * 7) + 2),
    });
    await demand.save();
    console.log(`  ✓ ${d.title} by ${d.buyer}`);
  }

  // ─── Create Chats with Hinglish conversations ─────────────────────────────────
  console.log('\nCreating chats...');

  // ── Chat 1: Abhinav buys keyboard from Udit (4th yr buying from 3rd yr — friendly) ──
  // This one goes through full bargaining and completes
  const chat1 = new Chat({
    listing: listings.keyboard._id,
    buyer: users.abhinav._id,
    seller: users.udit._id,
    chatType: 'listing',
    mode: 'negotiation',
    negotiation: {
      currentRound: 3,
      maxRounds: 3,
      offers: [
        { round: 1, amount: 1500, status: 'rejected', createdAt: daysAgo(4), updatedAt: daysAgo(4) },
        { round: 2, amount: 1700, status: 'rejected', createdAt: daysAgo(3), updatedAt: daysAgo(3) },
        { round: 3, amount: 1800, status: 'accepted', createdAt: daysAgo(2), updatedAt: daysAgo(2) },
      ],
      outcome: 'accepted',
      agreedPrice: 1800,
    },
    messages: [
      msg(users.abhinav._id, 'bhai ye keyboard kaisa hai? rgb wala hai na?', 'text', 5*24*60),
      msg(users.udit._id, 'haan bro full rgb, wireless bhi hai. bahut smooth hai typing', 'text', 5*24*60 - 20),
      msg(users.abhinav._id, 'kitne din use kiya hai?', 'text', 5*24*60 - 40),
      msg(users.udit._id, '6 mahine hogaye, lekin bohot accha maintain kiya hai', 'text', 5*24*60 - 55),
      msg(users.abhinav._id, 'thoda kam nhi hoga? 2k bohot hai yaar used ke liye', 'text', 4*24*60),
      msg(users.udit._id, 'bro amazon pe 3.5k ka hai, me 2k me de rha already cheap hai', 'text', 4*24*60 - 15),
      { sender: users.abhinav._id, type: 'system', content: '🃏 Bargaining started! 3 cards available.', createdAt: daysAgo(4) },
      offerMsg(users.abhinav._id, 1500, 4*24*60 - 30),
      { sender: users.udit._id, type: 'system', content: '❌ Offer of ₹1,500 rejected', createdAt: daysAgo(4) },
      msg(users.udit._id, 'bhai itna kam nhi hoga, 1500 me toh naya trimmer aata hai lol', 'text', 3*24*60),
      offerMsg(users.abhinav._id, 1700, 3*24*60 - 20),
      { sender: users.udit._id, type: 'system', content: '❌ Offer of ₹1,700 rejected', createdAt: daysAgo(3) },
      msg(users.udit._id, 'last card hai tera, soch ke khel', 'text', 2*24*60 + 60),
      offerMsg(users.abhinav._id, 1800, 2*24*60),
      { sender: users.udit._id, type: 'system', content: '✅ Offer of ₹1,800 accepted! Deal done.', createdAt: daysAgo(2) },
      msg(users.udit._id, 'done bhai 1800 chalega, aaja BH-3 room 204', 'text', 2*24*60 - 10),
      msg(users.abhinav._id, 'mast! aaj shaam aata hu', 'text', 2*24*60 - 15),
    ],
    status: 'completed',
    lastMessageAt: daysAgo(2),
    createdAt: daysAgo(5),
  });
  // Fix system messages - they need a sender
  chat1.messages.forEach(m => { if (!m.sender) m.sender = users.udit._id; });
  await chat1.save();
  console.log('  ✓ Chat: Abhinav ↔ Udit (keyboard) — bargaining → accepted ₹1800');

  // ── Chat 2: Kunal buys pasta from Prasanna (4th yr to 3rd yr — casual) ──
  const chat2 = new Chat({
    listing: listings.pasta._id,
    buyer: users.kunal._id,
    seller: users.prasanna._id,
    chatType: 'listing',
    mode: 'normal',
    messages: [
      msg(users.kunal._id, 'bhai pasta available hai?', 'text', 2*24*60),
      msg(users.prasanna._id, 'haan bhai sealed hai. ₹25 only', 'text', 2*24*60 - 10),
      msg(users.kunal._id, 'sahi hai, 2 packet hai kya?', 'text', 2*24*60 - 20),
      msg(users.prasanna._id, 'ek hi extra hai bro, chahiye toh bata room pe aaja', 'text', 2*24*60 - 25),
      msg(users.kunal._id, 'ok aaj evening aaunga, BH-3 right?', 'text', 2*24*60 - 30),
      msg(users.prasanna._id, 'haan bhai room 312, ping karna aake', 'text', 2*24*60 - 35),
      msg(users.kunal._id, 'done 👍', 'quick-reply', 2*24*60 - 40),
    ],
    status: 'completed',
    lastMessageAt: daysAgo(2),
    createdAt: daysAgo(2),
  });
  await chat2.save();
  console.log('  ✓ Chat: Kunal ↔ Prasanna (pasta) — direct buy ₹25');

  // ── Chat 3: Pinkesh asks about cooler from Udit (2nd yr to 3rd yr — respectful) ──
  const chat3 = new Chat({
    listing: listings.cooler._id,
    buyer: users.pinkesh._id,
    seller: users.udit._id,
    chatType: 'listing',
    mode: 'normal',
    messages: [
      msg(users.pinkesh._id, 'bhaiya cooler available hai kya? rent pe lena tha', 'text', 6*24*60),
      msg(users.udit._id, 'haan bro available hai. ₹80/day deposit 1000', 'text', 6*24*60 - 15),
      msg(users.pinkesh._id, 'kitne din ke liye de sakte ho?', 'text', 6*24*60 - 25),
      msg(users.udit._id, 'max 30 din, uske baad dekhenge extend karna ho toh', 'text', 6*24*60 - 30),
      msg(users.pinkesh._id, 'cooling kaisi hai? room size 12x10 hai', 'text', 6*24*60 - 40),
      msg(users.udit._id, '45 litre hai Kenstar, medium room ke liye perfect. mera room bhi similar size hai', 'text', 6*24*60 - 50),
      msg(users.pinkesh._id, 'ok bhaiya, abhi auction chal rha hai na iska?', 'text', 5*24*60),
      msg(users.udit._id, 'haan auction me bhi dala hai selling ke liye, but rent wala option bhi hai. agar koi buy nhi karta toh rent pe de dunga', 'text', 5*24*60 - 10),
      msg(users.pinkesh._id, 'sahi hai, me wait karta hu. agar auction nhi bika toh mujhe rent pe de dena', 'text', 5*24*60 - 20),
      msg(users.udit._id, 'done bro 👍', 'quick-reply', 5*24*60 - 25),
    ],
    status: 'active',
    lastMessageAt: daysAgo(5),
    createdAt: daysAgo(6),
  });
  await chat3.save();
  console.log('  ✓ Chat: Pinkesh ↔ Udit (cooler rental) — active');

  // ── Chat 4: Nishant tries to buy trimmer from Abhinav (1st yr to 4th yr — sir vibe) ──
  const chat4 = new Chat({
    listing: listings.trimmer._id,
    buyer: users.nishant._id,
    seller: users.abhinav._id,
    chatType: 'listing',
    mode: 'negotiation',
    negotiation: {
      currentRound: 2,
      maxRounds: 3,
      offers: [
        { round: 1, amount: 150, status: 'rejected', createdAt: daysAgo(5), updatedAt: daysAgo(5) },
        { round: 2, amount: 200, status: 'accepted', createdAt: daysAgo(4), updatedAt: daysAgo(4) },
      ],
      outcome: 'accepted',
      agreedPrice: 200,
    },
    messages: [
      msg(users.nishant._id, 'sir trimmer abhi available hai kya?', 'text', 6*24*60),
      msg(users.abhinav._id, 'haan available hai. interested?', 'text', 6*24*60 - 15),
      msg(users.nishant._id, 'ji sir, thoda price kam ho jayega kya? student hu budget tight hai', 'text', 6*24*60 - 30),
      msg(users.abhinav._id, 'bro 250 already bahut sasta hai, new 600+ ka hai', 'text', 6*24*60 - 40),
      { sender: users.nishant._id, type: 'system', content: '🃏 Bargaining started! 3 cards available.', createdAt: daysAgo(5) },
      offerMsg(users.nishant._id, 150, 5*24*60),
      { sender: users.abhinav._id, type: 'system', content: '❌ Offer of ₹150 rejected', createdAt: daysAgo(5) },
      msg(users.abhinav._id, '150 nhi hoga bro, 200 chalega?', 'text', 5*24*60 - 10),
      offerMsg(users.nishant._id, 200, 4*24*60),
      { sender: users.abhinav._id, type: 'system', content: '✅ Offer of ₹200 accepted! Deal done.', createdAt: daysAgo(4) },
      msg(users.abhinav._id, 'done 200 me le ja, BH-3 room 108', 'text', 4*24*60 - 5),
      msg(users.nishant._id, 'thank you sir! aaj aa jaunga', 'text', 4*24*60 - 10),
    ],
    status: 'completed',
    lastMessageAt: daysAgo(4),
    createdAt: daysAgo(6),
  });
  chat4.messages.forEach(m => { if (!m.sender) m.sender = users.abhinav._id; });
  await chat4.save();
  console.log('  ✓ Chat: Nishant ↔ Abhinav (trimmer) — bargaining → accepted ₹200');

  // ── Chat 5: Darshan interested in globe from Kunal (1st yr to 4th yr) ──
  const chat5 = new Chat({
    listing: listings.globe._id,
    buyer: users.darshan._id,
    seller: users.kunal._id,
    chatType: 'listing',
    mode: 'normal',
    messages: [
      msg(users.darshan._id, 'bhaiya ye globe lamp kaisa hai? photo me accha dikh rha', 'text', 7*24*60),
      msg(users.kunal._id, 'haan accha hai bro, room me rakhta tha. night light jaisa use hota hai', 'text', 7*24*60 - 10),
      msg(users.darshan._id, 'koi defect wagera toh nhi?', 'text', 7*24*60 - 20),
      msg(users.kunal._id, 'nah bro, bass thoda dusty ho gaya long time se pada tha. clean kar lena', 'text', 7*24*60 - 30),
      msg(users.darshan._id, '100 me de do sir?', 'text', 7*24*60 - 40),
      msg(users.kunal._id, '120 fix hai yaar, already bahut cheap', 'text', 7*24*60 - 50),
      msg(users.darshan._id, 'ok theek hai 120 done, kab milega?', 'text', 7*24*60 - 55),
      msg(users.kunal._id, 'aaj shaam BH-3 aaja', 'text', 7*24*60 - 60),
    ],
    status: 'completed',
    lastMessageAt: daysAgo(7),
    createdAt: daysAgo(7),
  });
  await chat5.save();
  console.log('  ✓ Chat: Darshan ↔ Kunal (globe) — direct buy ₹120');

  // ── Chat 6: Taksh tries to sell foam cleaner to Neeraj (3rd yr friends — banter) ──
  const chat6 = new Chat({
    listing: listings.foam._id,
    buyer: users.neeraj._id,
    seller: users.taksh._id,
    chatType: 'listing',
    mode: 'normal',
    messages: [
      msg(users.neeraj._id, 'bhai ye shoe cleaner hai kya?', 'text', 3*24*60),
      msg(users.taksh._id, 'haan foam cleaner hai, shoes ke liye', 'text', 3*24*60 - 10),
      msg(users.neeraj._id, 'white shoes pe kaam karega?', 'text', 3*24*60 - 15),
      msg(users.taksh._id, 'haan bro, maine apne white shoes pe hi use kiya tha. sahi clean hota hai', 'text', 3*24*60 - 20),
      msg(users.neeraj._id, '300 thoda zyada nhi hai bhai? 200 me de de', 'text', 3*24*60 - 30),
      msg(users.taksh._id, 'bhai almost full hai bottle, 300 sahi price hai. amazon pe 450 ka hai', 'text', 3*24*60 - 40),
      msg(users.neeraj._id, 'chal theek hai sochta hu', 'text', 3*24*60 - 50),
    ],
    status: 'active',
    lastMessageAt: daysAgo(3),
    createdAt: daysAgo(3),
  });
  await chat6.save();
  console.log('  ✓ Chat: Neeraj ↔ Taksh (foam cleaner) — active negotiation');

  // ── Chat 7: Kunal asks Prasanna about pasta (linked to demand) ──
  const chat7 = new Chat({
    listing: listings.pasta._id,
    buyer: users.darshan._id,
    seller: users.prasanna._id,
    chatType: 'listing',
    mode: 'normal',
    messages: [
      msg(users.darshan._id, 'bhaiya pasta wala listing dekha, available hai?', 'text', 1*24*60),
      msg(users.prasanna._id, 'sorry bro already sold ho gaya', 'text', 1*24*60 - 10),
      msg(users.darshan._id, 'oh ok, thanks bhaiya', 'text', 1*24*60 - 15),
    ],
    status: 'active',
    lastMessageAt: daysAgo(1),
    createdAt: daysAgo(1),
  });
  await chat7.save();
  console.log('  ✓ Chat: Darshan ↔ Prasanna (pasta) — already sold');

  // ── Chat 8: Pinkesh wants namkeen from Neeraj (2nd yr friends) ──
  const chat8 = new Chat({
    listing: listings.namkeen._id,
    buyer: users.pinkesh._id,
    seller: users.neeraj._id,
    chatType: 'listing',
    mode: 'normal',
    messages: [
      msg(users.pinkesh._id, 'bro namkeen hai kya abhi? ghar ka hai?', 'text', 4*24*60),
      msg(users.neeraj._id, 'haan bhai nakoda namkeen, ghar se laaya tha bahut zyada. sealed hai', 'text', 4*24*60 - 10),
      msg(users.pinkesh._id, 'mast hai yaar, le leta hu. 100 me de?', 'text', 4*24*60 - 15),
      msg(users.neeraj._id, 'bhai 120 hi rakh, itna sasta hai already', 'text', 4*24*60 - 20),
      msg(users.pinkesh._id, 'chal done 120, aaj canteen me milte hai', 'text', 4*24*60 - 25),
      msg(users.neeraj._id, 'done aaja 6 baje canteen', 'text', 4*24*60 - 30),
    ],
    status: 'completed',
    lastMessageAt: daysAgo(4),
    createdAt: daysAgo(4),
  });
  await chat8.save();
  console.log('  ✓ Chat: Pinkesh ↔ Neeraj (namkeen) — direct buy ₹120');

  // ── Chat 9: Abhinav inquires serum interest from Taksh ──
  const chat9 = new Chat({
    listing: listings.serum._id,
    buyer: users.taksh._id,
    seller: users.abhinav._id,
    chatType: 'listing',
    mode: 'normal',
    messages: [
      msg(users.taksh._id, 'bhai ye hair serum kaisa hai? frizzy hair ke liye?', 'text', 2*24*60),
      msg(users.abhinav._id, 'haan bro, inbily ka hai. 10 in 1 formula. mere pe toh accha kaam karta hai', 'text', 2*24*60 - 10),
      msg(users.taksh._id, '700 thoda expensive nhi hai?', 'text', 2*24*60 - 15),
      msg(users.abhinav._id, 'bro sealed pack hai, MRP 900 hai. 700 discount me de rha already', 'text', 2*24*60 - 20),
      msg(users.taksh._id, 'accha sochta hu, raat tak batata hu', 'text', 2*24*60 - 25),
    ],
    status: 'active',
    lastMessageAt: daysAgo(2),
    createdAt: daysAgo(2),
  });
  await chat9.save();
  console.log('  ✓ Chat: Taksh ↔ Abhinav (serum) — active inquiry');

  // ── Chat 10: Nishant asks about digital clock from Kunal ──
  const chat10 = new Chat({
    listing: listings.clock._id,
    buyer: users.nishant._id,
    seller: users.kunal._id,
    chatType: 'listing',
    mode: 'negotiation',
    negotiation: {
      currentRound: 1,
      maxRounds: 3,
      offers: [
        { round: 1, amount: 150, status: 'pending', createdAt: daysAgo(1), updatedAt: daysAgo(1) },
      ],
      outcome: 'pending',
      agreedPrice: null,
    },
    messages: [
      msg(users.nishant._id, 'sir ye digital clock abhi bhi available hai?', 'text', 3*24*60),
      msg(users.kunal._id, 'haan available hai', 'text', 3*24*60 - 10),
      msg(users.nishant._id, 'temperature bhi dikhata hai na?', 'text', 3*24*60 - 15),
      msg(users.kunal._id, 'haan bro, time + temp dono. USB se chalta hai', 'text', 3*24*60 - 20),
      { sender: users.nishant._id, type: 'system', content: '🃏 Bargaining started! 3 cards available.', createdAt: daysAgo(1) },
      offerMsg(users.nishant._id, 150, 1*24*60),
      msg(users.nishant._id, 'sir 150 chalega? student hu tight budget', 'text', 1*24*60 - 5),
    ],
    status: 'active',
    lastMessageAt: daysAgo(1),
    createdAt: daysAgo(3),
  });
  chat10.messages.forEach(m => { if (!m.sender) m.sender = users.kunal._id; });
  await chat10.save();
  console.log('  ✓ Chat: Nishant ↔ Kunal (clock) — bargaining in progress, ₹150 pending');

  // ─── Create Transactions for completed deals ─────────────────────────────────
  console.log('\nCreating transactions...');

  // Transaction 1: Keyboard — Abhinav bought from Udit @ ₹1800
  const tx1 = new Transaction({
    listing: listings.keyboard._id,
    buyer: users.abhinav._id,
    seller: users.udit._id,
    chat: chat1._id,
    source: 'negotiation',
    agreedPrice: 1800,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    status: 'completed',
    buyerConfirmed: true,
    sellerConfirmed: true,
    completedAt: daysAgo(1),
    createdAt: daysAgo(2),
  });
  await tx1.save();
  // Mark listing as sold
  listings.keyboard.status = 'sold';
  await listings.keyboard.save();
  // Update trade counts
  users.abhinav.totalTrades += 1;
  users.udit.totalTrades += 1;
  await users.abhinav.save();
  await users.udit.save();
  console.log('  ✓ Transaction: Keyboard — Abhinav → Udit ₹1800 (completed)');

  // Transaction 2: Trimmer — Nishant bought from Abhinav @ ₹200
  const tx2 = new Transaction({
    listing: listings.trimmer._id,
    buyer: users.nishant._id,
    seller: users.abhinav._id,
    chat: chat4._id,
    source: 'negotiation',
    agreedPrice: 200,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    status: 'completed',
    buyerConfirmed: true,
    sellerConfirmed: true,
    completedAt: daysAgo(3),
    createdAt: daysAgo(4),
  });
  await tx2.save();
  listings.trimmer.status = 'sold';
  await listings.trimmer.save();
  users.nishant.totalTrades += 1;
  users.abhinav.totalTrades += 1; // another trade for abhinav
  await users.nishant.save();
  await users.abhinav.save();
  console.log('  ✓ Transaction: Trimmer — Nishant → Abhinav ₹200 (completed)');

  // Transaction 3: Pasta — Kunal bought from Prasanna @ ₹25
  const tx3 = new Transaction({
    listing: listings.pasta._id,
    buyer: users.kunal._id,
    seller: users.prasanna._id,
    chat: chat2._id,
    source: 'negotiation',
    agreedPrice: 25,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    status: 'completed',
    buyerConfirmed: true,
    sellerConfirmed: true,
    completedAt: daysAgo(1),
    createdAt: daysAgo(2),
  });
  await tx3.save();
  listings.pasta.status = 'sold';
  await listings.pasta.save();
  users.kunal.totalTrades += 1;
  users.prasanna.totalTrades += 1;
  await users.kunal.save();
  await users.prasanna.save();
  console.log('  ✓ Transaction: Pasta — Kunal → Prasanna ₹25 (completed)');

  // Transaction 4: Globe — Darshan bought from Kunal @ ₹120
  const tx4 = new Transaction({
    listing: listings.globe._id,
    buyer: users.darshan._id,
    seller: users.kunal._id,
    chat: chat5._id,
    source: 'negotiation',
    agreedPrice: 120,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    status: 'completed',
    buyerConfirmed: true,
    sellerConfirmed: true,
    completedAt: daysAgo(6),
    createdAt: daysAgo(7),
  });
  await tx4.save();
  listings.globe.status = 'sold';
  await listings.globe.save();
  users.darshan.totalTrades += 1;
  users.kunal.totalTrades += 1;
  await users.darshan.save();
  await users.kunal.save();
  console.log('  ✓ Transaction: Globe — Darshan → Kunal ₹120 (completed)');

  // Transaction 5: Namkeen — Pinkesh bought from Neeraj @ ₹120
  const tx5 = new Transaction({
    listing: listings.namkeen._id,
    buyer: users.pinkesh._id,
    seller: users.neeraj._id,
    chat: chat8._id,
    source: 'negotiation',
    agreedPrice: 120,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    status: 'completed',
    buyerConfirmed: true,
    sellerConfirmed: true,
    completedAt: daysAgo(3),
    createdAt: daysAgo(4),
  });
  await tx5.save();
  listings.namkeen.status = 'sold';
  await listings.namkeen.save();
  users.pinkesh.totalTrades += 1;
  users.neeraj.totalTrades += 1;
  await users.pinkesh.save();
  await users.neeraj.save();
  console.log('  ✓ Transaction: Namkeen — Pinkesh → Neeraj ₹120 (completed)');

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  SEED COMPLETE!');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Users: ${userData.length}`);
  console.log(`  Listings: ${listingData.length} (5 sold, 1 auction, 1 rental, 3 active)`);
  console.log(`  Chats: 10 (5 completed, 5 active)`);
  console.log(`  Transactions: 5 completed`);
  console.log(`  Demands: ${demands.length}`);
  console.log('\n  Login credentials:');
  for (const u of userData) {
    console.log(`    ${u.realName.padEnd(24)} ${u.email.padEnd(40)} pw: ${u.pwd}`);
  }
  console.log('══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
