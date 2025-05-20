const express = require('express');
const router = express.Router();
const {
  getFlightPricing,
  getSingleFlightPricing,
  searchFlightPricing,
  createFlightPricing,
  updateFlightPricing,
  deleteFlightPricing
} = require('../controllers/flightPricingController');

const { protect, authorize } = require('../middleware/auth');

// Search route needs to be before the ID route to avoid conflict
router.route('/search')
  .get(protect, authorize('admin', 'worker'), searchFlightPricing);

router.route('/')
  .get(protect, authorize('admin', 'worker'), getFlightPricing)
  .post(protect, authorize('admin'), createFlightPricing);

router.route('/:id')
  .get(protect, authorize('admin', 'worker'), getSingleFlightPricing)
  .put(protect, authorize('admin'), updateFlightPricing)
  .delete(protect, authorize('admin'), deleteFlightPricing);

module.exports = router;