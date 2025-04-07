const express = require('express');

//TODO rename the thing to users
const router = express.Router();

const {
  getPassengers,
  getPassenger,
  createPassenger,
  updatePassenger,
  deletePassenger,
  getPassengerTickets
} = require('../controllers/passengerController');

const { protect, authorize } = require('../middleware/auth');
const { validatePassenger } = require('../middleware/validator');

// Passenger tickets
router.route('/:id/tickets')
  .get(protect, getPassengerTickets);

// Main resource routes
router.route('/')
  .get(protect, authorize('admin', 'staff'), getPassengers)
  .post(validatePassenger, createPassenger);

router.route('/:id')
  .get(protect, getPassenger)
  .put(protect, validatePassenger, updatePassenger)
  .delete(protect, authorize('admin'), deletePassenger);

module.exports = router;