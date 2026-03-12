const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createTransaction, getTransaction, getTransactionByChat, getTransactionByListing, markPaymentDone, confirmTransaction, completeTransaction, requestReturn, submitRating, getHistory } = require('../controllers/transactionController');

router.use(auth); // all transaction routes require authentication

router.get('/history', getHistory); // must be before /:id
router.get('/by-chat/:chatId', getTransactionByChat);
router.get('/by-listing/:listingId', getTransactionByListing);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id/pay', markPaymentDone);
router.put('/:id/confirm', confirmTransaction);
router.put('/:id/complete', completeTransaction);
router.put('/:id/return', requestReturn);
router.post('/:id/rate', submitRating);

module.exports = router;
