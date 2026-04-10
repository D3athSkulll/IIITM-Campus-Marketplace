const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const {
  getStats,
  getUsers,
  getDisputes,
  resolveDispute,
  updateUserRole,
  getFlaggedListings,
  getAllListings,
  deleteListing,
  getAllDemands,
  deleteDemand,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(auth, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/disputes', getDisputes);
router.put('/disputes/:id/resolve', resolveDispute);
router.put('/users/:id/role', updateUserRole);
router.get('/flagged-listings', getFlaggedListings);
router.get('/listings', getAllListings);
router.delete('/listings/:id', deleteListing);
router.get('/demands', getAllDemands);
router.delete('/demands/:id', deleteDemand);

module.exports = router;
