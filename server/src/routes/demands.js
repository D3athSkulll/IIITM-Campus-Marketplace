const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getDemands, getDemand, createDemand, closeDemand, deleteDemand, getMyDemands } = require('../controllers/demandController');

router.get('/', getDemands);
router.get('/my', auth, getMyDemands);  // must be before /:id
router.get('/:id', getDemand);
router.post('/', auth, createDemand);
router.put('/:id/close', auth, closeDemand);
router.delete('/:id', auth, deleteDemand);

module.exports = router;
