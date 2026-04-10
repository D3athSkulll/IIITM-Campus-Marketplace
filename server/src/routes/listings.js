const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const {
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
} = require('../controllers/listingController');

// Public routes
router.get('/', getListings);
router.get('/my', auth, getMyListings);  // must be before /:id
router.get('/:id/auction', optionalAuth, getAuctionDetails);
router.get('/:id', optionalAuth, getListing);

// Protected routes
router.post('/', auth, createListing);
router.put('/:id', auth, updateListing);
router.delete('/:id', auth, deleteListing);
router.post('/:id/interest', auth, markInterest);
router.post('/:id/auction-request', auth, requestAuctionByBuyer);
router.delete('/:id/auction-request', auth, withdrawAuctionRequest);
router.put('/:id/auction', auth, enableAuction);
router.post('/:id/auction/bid', auth, placeAuctionBid);
router.post('/:id/auction/close', auth, closeAuction);
router.put('/:id/link-demand', auth, linkDemand);

module.exports = router;
