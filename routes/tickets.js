const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  bookTicket,
  updateTicket,
  deleteTicket,
  printTicket,
  getTicketsByUser,
  getTicketsByFlight,
  generateTicketSalesReport,
  updatePaymentStatus,
  getAvailableSeats,
  getTicketsByFlightNumber,
  getTicketsByPassportNumber
} = require('../controllers/ticketController');

const { protect, authorize } = require('../middleware/auth');

// Reports route
router.route('/reports/sales')
  .get(protect, authorize('admin', 'worker'), generateTicketSalesReport);

// User and flight ticket routes
router.route('/user/:userId')
  .get(protect, getTicketsByUser);

router.route('/flight/:flightId')
  .get(protect, authorize('admin', 'worker'), getTicketsByFlight);

router.route('/flight/:flightId/available-seats')
  .get(getAvailableSeats);
  
// Tickets by flight number route
router.route('/flight-number/:flightNumber')
  .get(protect, authorize('admin', 'worker'), getTicketsByFlightNumber);

// Tickets by passport number route
router.route('/passport/:passportNumber')
  .get(protect, authorize('admin', 'worker'), getTicketsByPassportNumber);
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