const express = require('express');
const router = express.Router();
const {
  getFlights,
  getFlight,
  createFlight,
  updateFlight,
  deleteFlight,
  searchFlightsByRouteAndDate,
  generateFlightSchedule,
  cancelFlight,
  getFlightPrices
} = require('../controllers/flightController');

const { protect, authorize } = require('../middleware/auth');
const { searchFlightsByRoute } = require('../models/flightModel');

// Route for search and schedule endpoints
router.route('/search/by-route-date')
  .get(searchFlightsByRouteAndDate);

router.route('/search/by-route')
  .get(searchFlightsByRoute);

router.route('/schedule/generate')
  .get(generateFlightSchedule);

// Flight cancellation route
router.route('/:id/cancel')
  .patch(protect, authorize('admin', 'worker'), cancelFlight);

// Flight prices route
router.route('/:id/prices')
  .get(getFlightPrices);

// Main resource routes
router.route('/')
  .get(getFlights)
  .post(protect, authorize('admin', 'worker'), createFlight);

router.route('/:id')
  .get(getFlight)
  .put(protect, authorize('admin', 'worker'), updateFlight)
  .delete(protect, authorize('admin'), deleteFlight);

module.exports = router;