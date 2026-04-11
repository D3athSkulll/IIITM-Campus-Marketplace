const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getChats, getChat, getUnreadCount, initiateChat, sendMessage, startNegotiation, submitOffer, respondToOffer } = require('../controllers/chatController');

router.use(auth); // all chat routes require authentication

router.get('/', getChats);
router.get('/unread-count', getUnreadCount);
router.get('/:id', getChat);
router.post('/', initiateChat);
router.post('/:id/message', sendMessage);
router.post('/:id/negotiate', startNegotiation);
router.post('/:id/offer', submitOffer);
router.post('/:id/respond', respondToOffer);

module.exports = router;
