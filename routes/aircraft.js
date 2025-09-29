const express = require('express');
const router = express.Router();
const {
  getAircraft,
  getSingleAircraft,
  createAircraft,
  updateAircraft,
  deleteAircraft,
  getAircraftFlights
} = require('../controllers/aircraftController');

const { protect, authorize } = require('../middleware/auth');

router.route('/:id/flights')
  .get(protect, authorize('admin', 'worker'), getAircraftFlights);

router.route('/')
  .get(protect, authorize('admin', 'worker'), getAircraft)
  .post(protect, authorize('admin'), createAircraft);

router.route('/:id')
  .get(protect, authorize('admin', 'worker'), getSingleAircraft)
  .put(protect, authorize('admin'), updateAircraft)
  .delete(protect, authorize('admin'), deleteAircraft);

module.exports = router;
