const Ticket = require('../models/ticketModel');
const Flight = require('../models/flightModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private/Admin
exports.getTickets = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const tickets = await Ticket.getAllTickets(page, limit);
  
  res.status(200).json({
    success: true,
    count: tickets.data.length,
    pagination: {
      page: tickets.page,
      limit: tickets.limit,
      totalPages: tickets.totalPages,
      totalItems: tickets.totalItems
    },
    data: tickets.data
  });
});

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.getTicketById(req.params.id);
  
  if (!ticket) {
    return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
  }
  
  // If not admin and not the ticket owner
  if (req.user.role !== 'admin' && req.user.passenger_id !== ticket.passenger_id) {
    return next(new ErrorResponse('Not authorized to access this ticket', 403));
  }
  
  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Generate printable ticket
// @route   GET /api/tickets/:id/print
// @access  Private
exports.printTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.getTicketById(req.params.id);
  
  if (!ticket) {
    return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
  }
  
  // If not admin and not the ticket owner
  if (req.user.role !== 'admin' && req.user.passenger_id !== ticket.passenger_id) {
    return next(new ErrorResponse('Not authorized to access this ticket', 403));
  }
  
  const printableTicket = await Ticket.generateTicket(req.params.id);
  
  if (!printableTicket) {
    return next(new ErrorResponse(`Failed to generate printable ticket`, 500));
  }
  
  res.status(200).json({
    success: true,
    data: printableTicket
  });
});

// @desc    Get tickets by passenger
// @route   GET /api/tickets/passenger/:passengerId
// @access  Private
exports.getTicketsByPassenger = asyncHandler(async (req, res, next) => {
  // If not admin and not the passenger
  if (req.user.role !== 'admin' && req.user.passenger_id != req.params.passengerId) {
    return next(new ErrorResponse('Not authorized to access these tickets', 403));
  }
  
  const tickets = await Ticket.getTicketsByPassenger(req.params.passengerId);
  
  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get tickets by flight
// @route   GET /api/tickets/flight/:flightId
// @access  Private/Admin
exports.getTicketsByFlight = asyncHandler(async (req, res, next) => {
  const tickets = await Ticket.getTicketsByFlight(req.params.flightId);
  
  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Generate ticket sales report
// @route   GET /api/tickets/reports/sales
// @access  Private/Admin
exports.generateTicketSalesReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(new ErrorResponse('Please provide start date and end date', 400));
  }
  
  const report = await Ticket.generateTicketSalesReport(startDate, endDate);
  
  res.status(200).json({
    success: true,
    count: report.length,
    data: report
  });
});

// @desc    Book a ticket
// @route   POST /api/tickets
// @access  Private
exports.bookTicket = asyncHandler(async (req, res, next) => {
  // Verify flight exists and is not canceled
  const flight = await Flight.getFlightById(req.body.flight_id);
  
  if (!flight) {
    return next(new ErrorResponse('Flight not found', 404));
  }
  
  if (flight.status === 'canceled') {
    return next(new ErrorResponse('Cannot book tickets for a canceled flight', 400));
  }
  
  if (flight.status === 'arrived') {
    return next(new ErrorResponse('Cannot book tickets for a completed flight', 400));
  }
  
  // Check if seat is available
  const isSeatAvailable = await Ticket.isSeatAvailable(req.body.flight_id, req.body.seat_number);
  
  if (!isSeatAvailable) {
    return next(new ErrorResponse('Seat already booked', 409));
  }
  
  // Check if flight is full
  if (flight.booked_seats >= flight.total_capacity) {
    return next(new ErrorResponse('Flight is fully booked', 400));
  }
  
  // Set passenger ID from current user if not specified
  if (!req.body.passenger_id && req.user.passenger_id) {
    req.body.passenger_id = req.user.passenger_id;
  }
  
  // Create the ticket
  const ticketId = await Ticket.createTicket(req.body);
  
  const ticket = await Ticket.getTicketById(ticketId);
  
  res.status(201).json({
    success: true,
    data: ticket
  });
});

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = asyncHandler(async (req, res, next) => {
  let ticket = await Ticket.getTicketById(req.params.id);
  
  if (!ticket) {
    return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
  }
  
  // If not admin and not the ticket owner
  if (req.user.role !== 'admin' && req.user.passenger_id !== ticket.passenger_id) {
    return next(new ErrorResponse('Not authorized to update this ticket', 403));
  }
  
  // If changing seat, check availability
  if (req.body.seat_number && req.body.seat_number !== ticket.seat_number) {
    const isSeatAvailable = await Ticket.isSeatAvailable(
      ticket.flight_id,
      req.body.seat_number,
      req.params.id
    );
    
    if (!isSeatAvailable) {
      return next(new ErrorResponse('Seat already booked', 409));
    }
  }
  
  // Regular users can only update seat
  if (req.user.role !== 'admin') {
    req.body = { seat_number: req.body.seat_number };
  }
  
  const updated = await Ticket.updateTicket(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
  }
  
  ticket = await Ticket.getTicketById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
exports.deleteTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.getTicketById(req.params.id);
  
  if (!ticket) {
    return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
  }
  
  // If not admin and not the ticket owner
  if (req.user.role !== 'admin' && req.user.passenger_id !== ticket.passenger_id) {
    return next(new ErrorResponse('Not authorized to delete this ticket', 403));
  }
  
  // Check if flight has already departed
  const flight = await Flight.getFlightById(ticket.flight_id);
  if (flight.status !== 'scheduled' && flight.status !== 'boarding' && req.user.role !== 'admin') {
    return next(new ErrorResponse('Cannot cancel ticket for a flight that has departed', 400));
  }
  
  await Ticket.deleteTicket(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update ticket payment status
// @route   PATCH /api/tickets/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const { payment_status } = req.body;
  
  if (!payment_status) {
    return next(new ErrorResponse('Please provide payment status', 400));
  }
  
  if (!['pending', 'completed', 'refunded'].includes(payment_status)) {
    return next(new ErrorResponse('Invalid payment status', 400));
  }
  
  const ticket = await Ticket.getTicketById(req.params.id);
  
  if (!ticket) {
    return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
  }
  
  await Ticket.updatePaymentStatus(req.params.id, payment_status);
  
  res.status(200).json({
    success: true,
    data: { payment_status }
  });
});


//TODO tickets are not done