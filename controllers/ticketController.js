const Ticket = require('../models/ticketModel');
const Flight = require('../models/flightModel');
const FlightSeats = require('../models/flightSeatsModel');
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
  if (req.user.role !== 'admin' && req.user.role !== 'worker' && req.user.user_id !== ticket.user_id) {
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
  if (req.user.role !== 'admin' && req.user.role !== 'worker' && req.user.user_id !== ticket.user_id) {
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

// @desc    Get tickets by user
// @route   GET /api/tickets/user/:userId
// @access  Private
exports.getTicketsByUser = asyncHandler(async (req, res, next) => {
  // If not admin and not the user
  if (req.user.role !== 'admin' && req.user.role !== 'worker' && req.user.user_id != req.params.userId) {
    return next(new ErrorResponse('Not authorized to access these tickets', 403));
  }
  
  const tickets = await Ticket.getTicketsByUser(req.params.userId);
  
  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get tickets by flight number
// @route   GET /api/tickets/flight-number/:flightNumber
// @access  Private/Admin/Staff
exports.getTicketsByFlightNumber = asyncHandler(async (req, res, next) => {
  const { flightNumber } = req.params;
  
  if (!flightNumber) {
    return next(new ErrorResponse('Please provide a flight number', 400));
  }
  
  const tickets = await Ticket.getTicketsByFlightNumber(flightNumber);
  
  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get tickets by passport number
// @route   GET /api/tickets/passport/:passportNumber
// @access  Private/Admin/Staff
exports.getTicketsByPassportNumber = asyncHandler(async (req, res, next) => {
  const { passportNumber } = req.params;
  
  if (!passportNumber) {
    return next(new ErrorResponse('Please provide a passport number', 400));
  }
  
  const tickets = await Ticket.getTicketsByPassportNumber(passportNumber);
  
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
  
  // Get the class (default to economy if not specified)
  const ticketClass = req.body.class || 'economy';
  
  // Check if seat is available in the specified class
  const isSeatAvailable = await FlightSeats.isSeatAvailable(
    req.body.flight_id,
    ticketClass,
    req.body.seat_number
  );
  
  if (!isSeatAvailable) {
    return next(new ErrorResponse('Seat already booked or not available in this class', 409));
  }
  
  // If booking woman_only class, validate gender
  if (ticketClass === 'woman_only') {
    const isValidForWomanOnly = FlightSeats.validateWomanOnlySeat(req.user.gender);
    
    if (!isValidForWomanOnly) {
      return next(new ErrorResponse('Woman-only seats can only be booked by female passengers', 403));
    }
  }
  
  // Set user ID from current user if not specified
  if (!req.body.user_id) {
    req.body.user_id = req.user.user_id;
  }
  
  // If price not provided, calculate based on flight base price and class multiplier
  if (!req.body.price) {
    // Get the appropriate multiplier for the class
    const multiplierField = `${ticketClass}_class_multiplier`;
    const defaultMultipliers = {
      economy: 1.0,
      business: 2.5,
      first: 4.0,
      woman_only: 1.2
    };
    
    const multiplier = flight[multiplierField] || defaultMultipliers[ticketClass];
    req.body.price = flight.base_price * multiplier;
  }
  
  try {
    // Create the ticket (this will also handle booking the seat)
    const ticketId = await Ticket.createTicket(req.body);
    const ticket = await Ticket.getTicketById(ticketId);
    
    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    return next(new ErrorResponse(`Error booking ticket: ${error.message}`, 500));
  }
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
  if (req.user.role !== 'admin' && req.user.role !== 'worker' && req.user.user_id !== ticket.user_id) {
    return next(new ErrorResponse('Not authorized to update this ticket', 403));
  }
  
  // If changing seat or class, validate the new seat
  if ((req.body.seat_number && req.body.seat_number !== ticket.seat_number) ||
      (req.body.class && req.body.class !== ticket.class)) {
    
    const newClass = req.body.class || ticket.class;
    const newSeat = req.body.seat_number || ticket.seat_number;
    
    // Check if new seat is available
    const isSeatAvailable = await FlightSeats.isSeatAvailable(
      ticket.flight_id,
      newClass,
      newSeat
    );
    
    if (!isSeatAvailable) {
      return next(new ErrorResponse('Requested seat is not available', 409));
    }
    
    // If changing to woman_only class, validate gender
    if (newClass === 'woman_only' && newClass !== ticket.class) {
      const isValidForWomanOnly = FlightSeats.validateWomanOnlySeat(req.user.gender);
      
      if (!isValidForWomanOnly) {
        return next(new ErrorResponse('Woman-only seats can only be booked by female passengers', 403));
      }
    }
  }
  
  // Regular users can only update seat and class
  if (req.user.role !== 'admin' && req.user.role !== 'worker') {
    req.body = { 
      seat_number: req.body.seat_number,
      class: req.body.class
    };
  }
  
  try {
    const updated = await Ticket.updateTicket(req.params.id, req.body);
    
    if (!updated) {
      return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
    }
    
    ticket = await Ticket.getTicketById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    return next(new ErrorResponse(`Error updating ticket: ${error.message}`, 500));
  }
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
  if (req.user.role !== 'admin' && req.user.role !== 'worker' && req.user.user_id !== ticket.user_id) {
    return next(new ErrorResponse('Not authorized to delete this ticket', 403));
  }
  
  // Check if flight has already departed
  const flight = await Flight.getFlightById(ticket.flight_id);
  if (flight.status !== 'scheduled' && flight.status !== 'boarding' && req.user.role !== 'admin') {
    return next(new ErrorResponse('Cannot cancel ticket for a flight that has departed', 400));
  }
  
  try {
    await Ticket.deleteTicket(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    return next(new ErrorResponse(`Error deleting ticket: ${error.message}`, 500));
  }
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

// @desc    Get available seats for a flight by class
// @route   GET /api/tickets/flight/:flightId/available-seats/:class?
// @access  Public
exports.getAvailableSeats = asyncHandler(async (req, res, next) => {
  const flightId = req.params.flightId;
  const seatClass = req.params.class; // Optional parameter
  
  const flight = await Flight.getFlightById(flightId);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${flightId}`, 404));
  }
  
  // Get available seats, either for a specific class or all classes
  const availableSeats = await Ticket.getAvailableSeatsByClass(flightId, seatClass);
  
  // Calculate prices for each class
  const prices = {};
  if (flight.base_price) {
    const classes = seatClass ? [seatClass] : Object.keys(availableSeats);
    
    for (const className of classes) {
      const multiplierField = `${className}_class_multiplier`;
      const defaultMultipliers = {
        economy: 1.0,
        business: 2.5,
        first: 4.0,
        woman_only: 1.2
      };
      
      const multiplier = flight[multiplierField] || defaultMultipliers[className];
      prices[className] = parseFloat(flight.base_price) * multiplier;
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      flight_id: flightId,
      flight_number: flight.flight_number,
      available_seats: availableSeats,
      prices: prices
    }
  });
});

// @desc    Validate seat for booking
// @route   POST /api/tickets/validate-seat
// @access  Private
exports.validateSeat = asyncHandler(async (req, res, next) => {
  const { flight_id, seat_number, class: seatClass } = req.body;
  
  if (!flight_id || !seat_number || !seatClass) {
    return next(new ErrorResponse('Please provide flight_id, seat_number, and class', 400));
  }
  
  const flight = await Flight.getFlightById(flight_id);
  
  if (!flight) {
    return next(new ErrorResponse('Flight not found', 404));
  }
  
  // Validate the seat
  const validationResult = await Ticket.validateSeatForBooking(
    flight_id,
    seat_number,
    seatClass,
    req.user.user_id
  );
  
  // Calculate price if seat is valid
  let price = null;
  if (validationResult.valid && flight.base_price) {
    const multiplierField = `${seatClass}_class_multiplier`;
    const defaultMultipliers = {
      economy: 1.0,
      business: 2.5,
      first: 4.0,
      woman_only: 1.2
    };
    
    const multiplier = flight[multiplierField] || defaultMultipliers[seatClass];
    price = parseFloat(flight.base_price) * multiplier;
  }
  
  res.status(200).json({
    success: true,
    data: {
      ...validationResult,
      flight_id,
      flight_number: flight.flight_number,
      seat_number,
      class: seatClass,
      price
    }
  });
});

// @desc    Hold a seat temporarily
// @route   POST /api/tickets/hold-seat
// @access  Private
exports.holdSeat = asyncHandler(async (req, res, next) => {
  const { flight_id, seat_number, class: seatClass } = req.body;
  
  if (!flight_id || !seat_number || !seatClass) {
    return next(new ErrorResponse('Please provide flight_id, seat_number, and class', 400));
  }
  
  const flight = await Flight.getFlightById(flight_id);
  
  if (!flight) {
    return next(new ErrorResponse('Flight not found', 404));
  }
  
  // This would typically involve a more complex implementation with Redis
  // or another system to track temporary holds
  // For now, we'll just check if the seat is available
  
  const seatAvailable = await FlightSeats.isSeatAvailable(flight_id, seatClass, seat_number);
  
  if (!seatAvailable) {
    return next(new ErrorResponse('Seat is not available', 409));
  }
  
  // If woman_only class, validate gender
  if (seatClass === 'woman_only') {
    const isValidForWomanOnly = FlightSeats.validateWomanOnlySeat(req.user.gender);
    
    if (!isValidForWomanOnly) {
      return next(new ErrorResponse('Woman-only seats can only be booked by female passengers', 403));
    }
  }
  
  // In a complete implementation, we would store the hold in a cache
  // with an expiration time
  
  res.status(200).json({
    success: true,
    message: 'Seat is available and can be held',
    data: {
      flight_id,
      flight_number: flight.flight_number,
      seat_number,
      class: seatClass,
      hold_expiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    }
  });
});

// @desc    Release a held seat
// @route   POST /api/tickets/release-seat
// @access  Private
exports.releaseSeat = asyncHandler(async (req, res, next) => {
  const { flight_id, seat_number, class: seatClass } = req.body;
  
  if (!flight_id || !seat_number || !seatClass) {
    return next(new ErrorResponse('Please provide flight_id, seat_number, and class', 400));
  }
  
  // In a complete implementation, we would remove the hold from our cache
  // Here we'll just verify the flight exists
  
  const flight = await Flight.getFlightById(flight_id);
  
  if (!flight) {
    return next(new ErrorResponse('Flight not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'Seat hold has been released',
    data: {
      flight_id,
      flight_number: flight.flight_number,
      seat_number,
      class: seatClass
    }
  });
});