const express = require('express');
const router = express.Router();
const {
  getCaptains,
  getCaptain,
  createCaptain,
  updateCaptain,
  deleteCaptain,
  getCaptainFlights
} = require('../controllers/captainController');

const { protect, authorize } = require('../middleware/auth');

// Captain flights
router.route('/:id/flights')
  .get(protect, authorize('admin', 'staff'), getCaptainFlights);

// Main resource routes
router.route('/')
  .get(protect, authorize('admin', 'staff'), getCaptains)
  .post(protect, authorize('admin'), createCaptain);

router.route('/:id')
  .get(protect, authorize('admin', 'staff'), getCaptain)
  .put(protect, authorize('admin'), updateCaptain)
  .delete(protect, authorize('admin'), deleteCaptain);

module.exports = router;

//TODO: handle the team management