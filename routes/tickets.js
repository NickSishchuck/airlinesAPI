const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  bookTicket,
  updateTicket,
  deleteTicket,
  printTicket,
  getTicketsByPassenger,
  getTicketsByFlight,
  generateTicketSalesReport,
  updatePaymentStatus
} = require('../controllers/ticketController');

const { protect, authorize } = require('../middleware/auth');

// Reports route
router.route('/reports/sales')
  .get(protect, authorize('admin', 'worker'), generateTicketSalesReport);

// Passenger and flight ticket routes
router.route('/passenger/:passengerId')
  .get(protect, getTicketsByPassenger);

router.route('/flight/:flightId')
  .get(protect, authorize('admin', 'worker'), getTicketsByFlight);

// Ticket printing route
router.route('/:id/print')
  .get(protect, printTicket);

// Payment status update route
router.route('/:id/payment')
  .patch(protect, authorize('admin', 'worker'), updatePaymentStatus);

// Main resource routes
router.route('/')
  .get(protect, authorize('admin', 'worker'), getTickets)
  .post(protect, bookTicket);

router.route('/:id')
  .get(protect, getTicket)
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

module.exports = router;
