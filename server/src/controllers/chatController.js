const Chat = require('../models/Chat');
const Listing = require('../models/Listing');
const { QUICK_REPLIES } = require('../models/Chat');
const { getIO } = require('../socket');

// Helper: broadcast chat refresh to both participants
const broadcastChatUpdate = (chatId, payload) => {
  try {
    getIO().to(`chat:${chatId}`).emit('chat:updated', payload);
  } catch {
    // Socket not ready (tests / seed), ignore
  }
};

/**
 * GET /api/chats
 * Get all chats for the current user (as buyer or seller)
 */
const getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({
      $or: [{ buyer: userId }, { seller: userId }],
      status: { $ne: 'failed' },
    })
      .sort({ lastMessageAt: -1 })
      .populate('listing', 'title images price status')
      .populate('buyer', 'displayName anonymousNickname realName showRealIdentity avatarUrl')
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    res.json({ chats, quickReplies: QUICK_REPLIES });
  } catch (error) {
    console.error('getChats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats.' });
  }
};

/**
 * GET /api/chats/:id
 * Get a single chat with full message history
 */
const getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('listing', 'title images price status seller condition category')
      .populate('buyer', 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock')
      .populate('seller', 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock')
      .populate('messages.sender', 'displayName anonymousNickname realName showRealIdentity avatarUrl');

    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    const userId = req.user._id.toString();
    const isBuyer = chat.buyer._id.toString() === userId;
    const isSeller = chat.seller._id.toString() === userId;
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const role = isBuyer ? 'buyer' : 'seller';
    res.json({ chat, role, quickReplies: QUICK_REPLIES[role] });
  } catch (error) {
    console.error('getChat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat.' });
  }
};

/**
 * POST /api/chats
 * Initiate a chat for a listing (buyer only)
 */
const initiateChat = async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: 'listingId is required.' });

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.status !== 'active') return res.status(400).json({ error: 'This listing is no longer active.' });

    const buyerId = req.user._id;
    if (listing.seller.toString() === buyerId.toString()) {
      return res.status(400).json({ error: 'You cannot chat about your own listing.' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({ listing: listingId, buyer: buyerId });
    if (chat) {
      await chat.populate([
        { path: 'listing', select: 'title images price status condition category seller' },
        { path: 'buyer', select: 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock' },
        { path: 'seller', select: 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock' },
        { path: 'messages.sender', select: 'displayName anonymousNickname realName showRealIdentity avatarUrl' },
      ]);
      return res.json({ chat, existing: true });
    }

    // Mark interest on listing
    await Listing.findByIdAndUpdate(listingId, { $inc: { interestCount: 1 } });

    chat = new Chat({
      listing: listingId,
      buyer: buyerId,
      seller: listing.seller,
    });

    chat.addMessage(buyerId, 'system', `Chat started for "${listing.title}"`);
    await chat.save();

    await chat.populate([
      { path: 'listing', select: 'title images price status condition category seller' },
      { path: 'buyer', select: 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock' },
      { path: 'seller', select: 'displayName anonymousNickname realName showRealIdentity avatarUrl hostelBlock' },
      { path: 'messages.sender', select: 'displayName anonymousNickname realName showRealIdentity avatarUrl' },
    ]);

    res.status(201).json({ chat, existing: false });
  } catch (error) {
    console.error('initiateChat error:', error);
    res.status(500).json({ error: 'Failed to start chat.' });
  }
};

/**
 * POST /api/chats/:id/message
 * Send a message (text or quick-reply)
 */
const sendMessage = async (req, res) => {
  try {
    const { content, type = 'text', imageUrl } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required.' });

    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    const userId = req.user._id.toString();
    const isBuyer = chat.buyer.toString() === userId;
    const isSeller = chat.seller.toString() === userId;
    if (!isBuyer && !isSeller) return res.status(403).json({ error: 'Access denied.' });

    if (chat.status !== 'active') {
      return res.status(400).json({ error: 'This chat is no longer active.' });
    }

    if (!['text', 'quick-reply', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Use /negotiate and /offer routes for negotiation messages.' });
    }

    if (type === 'image' && !imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required for image messages.' });
    }

    chat.addMessage(req.user._id, type, content, null, imageUrl || null);
    await chat.save();

    const newMessage = chat.messages[chat.messages.length - 1];

    // Populate sender so the client can render immediately
    await chat.populate('messages.sender', 'displayName anonymousNickname realName showRealIdentity avatarUrl');
    const populatedMsg = chat.messages[chat.messages.length - 1];

    broadcastChatUpdate(req.params.id, {
      type: 'message',
      chatId: req.params.id,
      message: populatedMsg,
    });

    res.json({ message: newMessage });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
};

/**
 * POST /api/chats/:id/negotiate
 * Start negotiation mode (buyer only)
 */
const startNegotiation = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (chat.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can start negotiation.' });
    }

    if (chat.status !== 'active') {
      return res.status(400).json({ error: 'Chat is not active.' });
    }

    chat.startNegotiation();
    await chat.save();

    broadcastChatUpdate(req.params.id, { type: 'negotiation-started', chatId: req.params.id });
    res.json({ message: 'Negotiation started!', chat });
  } catch (error) {
    if (error.message === 'Negotiation already started') {
      return res.status(400).json({ error: error.message });
    }
    console.error('startNegotiation error:', error);
    res.status(500).json({ error: 'Failed to start negotiation.' });
  }
};

/**
 * POST /api/chats/:id/offer
 * Submit a price offer (buyer only, uses one bargaining card)
 */
const submitOffer = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'A valid offer amount is required.' });

    const chat = await Chat.findById(req.params.id).populate('listing', 'price');
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (chat.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the buyer can submit offers.' });
    }

    const listingPrice = chat.listing?.price;
    chat.submitOffer(Number(amount), listingPrice);
    await chat.save();

    broadcastChatUpdate(req.params.id, { type: 'offer-submitted', chatId: req.params.id });
    res.json({
      message: `Offer of ₹${amount} submitted (Round ${chat.negotiation.currentRound})`,
      cardsRemaining: chat.cardsRemaining,
      negotiation: chat.negotiation,
    });
  } catch (error) {
    if (error.message.includes('bargaining cards') || error.message.includes('No active negotiation') ||
        error.message.includes('Offer must be less') || error.message.includes('lower than your previous')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('submitOffer error:', error);
    res.status(500).json({ error: 'Failed to submit offer.' });
  }
};

/**
 * POST /api/chats/:id/respond
 * Seller responds to the latest pending offer
 */
const respondToOffer = async (req, res) => {
  try {
    const { accepted } = req.body;
    if (accepted === undefined) return res.status(400).json({ error: '"accepted" (boolean) is required.' });

    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    if (chat.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the seller can respond to offers.' });
    }

    chat.respondToOffer(!!accepted);
    await chat.save();

    // If deal accepted, mark listing as reserved so no new buyers can chat
    if (accepted && chat.negotiation?.outcome === 'accepted') {
      await Listing.findByIdAndUpdate(chat.listing, { status: 'reserved' });
    }

    broadcastChatUpdate(req.params.id, { type: 'offer-responded', chatId: req.params.id });
    res.json({
      outcome: chat.negotiation.outcome,
      agreedPrice: chat.negotiation.agreedPrice,
      chatStatus: chat.status,
      negotiation: chat.negotiation,
    });
  } catch (error) {
    if (error.message.includes('No pending offer') || error.message.includes('No active negotiation')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('respondToOffer error:', error);
    res.status(500).json({ error: 'Failed to respond to offer.' });
  }
};

module.exports = { getChats, getChat, initiateChat, sendMessage, startNegotiation, submitOffer, respondToOffer };
