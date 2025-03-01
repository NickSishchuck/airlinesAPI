// routes/aircraft.js
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

// Aircraft flights
router.route('/:id/flights')
  .get(protect, authorize('admin', 'staff'), getAircraftFlights);

// Main resource routes
router.route('/')
  .get(protect, authorize('admin', 'staff'), getAircraft)
  .post(protect, authorize('admin'), createAircraft);

router.route('/:id')
  .get(protect, authorize('admin', 'staff'), getSingleAircraft)
  .put(protect, authorize('admin'), updateAircraft)
  .delete(protect, authorize('admin'), deleteAircraft);

module.exports = router;

