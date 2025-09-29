const express = require('express');
const router = express.Router();
const {
  initializeFlightSeats,
  getFlightSeatMap,
  getAvailableSeatsByClass,
  checkSeatAvailability,
  validateSeat,
  reconfigureFlightSeats
} = require('../controllers/flightSeatsController');

const { protect, authorize } = require('../middleware/auth');

router.route('/:flightId/seat-map')
  .get(getFlightSeatMap);

router.route('/:flightId/available/:class')
  .get(getAvailableSeatsByClass);

router.route('/:flightId/check/:class/:seatNumber')
  .get(checkSeatAvailability);

router.route('/:flightId/validate')
  .post(protect, validateSeat);

router.route('/:flightId/initialize')
  .post(protect, authorize('admin', 'worker'), initializeFlightSeats);

router.route('/:flightId/reconfigure')
  .put(protect, authorize('admin'), reconfigureFlightSeats);

module.exports = router;
