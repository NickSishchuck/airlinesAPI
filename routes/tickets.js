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
  getTicketsByPassportNumber,
  validateSeat,
  holdSeat,
  releaseSeat
} = require('../controllers/ticketController');

const { protect, authorize } = require('../middleware/auth');

router.route('/validate-seat')
  .post(protect, validateSeat);

router.route('/hold-seat')
  .post(protect, holdSeat);

router.route('/release-seat')
  .post(protect, releaseSeat);

router.route('/reports/sales')
  .get(protect, authorize('admin', 'worker'), generateTicketSalesReport);

router.route('/user/:userId')
  .get(protect, getTicketsByUser);

router.route('/flight/:flightId')
  .get(protect, authorize('admin', 'worker'), getTicketsByFlight);

router.route('/flight/:flightId/available-seats')
  .get(getAvailableSeats);

router.route('/flight/:flightId/available-seats/:class')
  .get(getAvailableSeats);

router.route('/flight-number/:flightNumber')
  .get(protect, authorize('admin', 'worker'), getTicketsByFlightNumber);

router.route('/passport/:passportNumber')
  .get(protect, authorize('admin', 'worker'), getTicketsByPassportNumber);

router.route('/:id/print')
  .get(protect, printTicket);

router.route('/:id/payment')
  .patch(protect, authorize('admin', 'worker'), updatePaymentStatus);

router.route('/')
  .get(protect, authorize('admin', 'worker'), getTickets)
  .post(protect, bookTicket);

router.route('/:id')
  .get(protect, getTicket)
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

module.exports = router;
