// controllers/passengerController.js
const Passenger = require('../models/passengerModel');
const Ticket = require('../models/ticketModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all passengers
// @route   GET /api/passengers
// @access  Private/Admin/Staff
exports.getPassengers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const passengers = await Passenger.getAllPassengers(page, limit);
  
  res.status(200).json({
    success: true,
    count: passengers.data.length,
    pagination: {
      page: passengers.page,
      limit: passengers.limit,
      totalPages: passengers.totalPages,
      totalItems: passengers.totalItems
    },
    data: passengers.data
  });
});

// @desc    Get single passenger
// @route   GET /api/passengers/:id
// @access  Private
exports.getPassenger = asyncHandler(async (req, res, next) => {
  const passenger = await Passenger.getPassengerById(req.params.id);
  
  if (!passenger) {
    return next(new ErrorResponse(`Passenger not found with id of ${req.params.id}`, 404));
  }
  
  // If not admin/staff and not the passenger
  if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.passenger_id != req.params.id) {
    return next(new ErrorResponse('Not authorized to access this passenger data', 403));
  }
  
  res.status(200).json({
    success: true,
    data: passenger
  });
});

// @desc    Create new passenger
// @route   POST /api/passengers
// @access  Public
exports.createPassenger = asyncHandler(async (req, res, next) => {
  // Check if passport number already exists
  const exists = await Passenger.passportExists(req.body.passport_number);
  
  if (exists) {
    return next(new ErrorResponse('Passenger with this passport number already exists', 409));
  }
  
  const passengerId = await Passenger.createPassenger(req.body);
  
  const passenger = await Passenger.getPassengerById(passengerId);
  
  res.status(201).json({
    success: true,
    data: passenger
  });
});

// @desc    Update passenger
// @route   PUT /api/passengers/:id
// @access  Private
exports.updatePassenger = asyncHandler(async (req, res, next) => {
  let passenger = await Passenger.getPassengerById(req.params.id);
  
  if (!passenger) {
    return next(new ErrorResponse(`Passenger not found with id of ${req.params.id}`, 404));
  }
  
  // If not admin and not the passenger
  if (req.user.role !== 'admin' && req.user.passenger_id != req.params.id) {
    return next(new ErrorResponse('Not authorized to update this passenger', 403));
  }
  
  // If changing passport, check if it exists
  if (req.body.passport_number && req.body.passport_number !== passenger.passport_number) {
    const exists = await Passenger.passportExists(req.body.passport_number, req.params.id);
    
    if (exists) {
      return next(new ErrorResponse('Passenger with this passport number already exists', 409));
    }
  }
  
  const updated = await Passenger.updatePassenger(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Passenger not found with id of ${req.params.id}`, 404));
  }
  
  passenger = await Passenger.getPassengerById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: passenger
  });
});

// @desc    Delete passenger
// @route   DELETE /api/passengers/:id
// @access  Private/Admin
exports.deletePassenger = asyncHandler(async (req, res, next) => {
  const passenger = await Passenger.getPassengerById(req.params.id);
  
  if (!passenger) {
    return next(new ErrorResponse(`Passenger not found with id of ${req.params.id}`, 404));
  }
  
  // Check if passenger has tickets
  const tickets = await Ticket.getTicketsByPassenger(req.params.id);
  
  if (tickets.length > 0) {
    return next(new ErrorResponse('Cannot delete passenger with booked tickets', 400));
  }
  
  await Passenger.deletePassenger(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get passenger tickets
// @route   GET /api/passengers/:id/tickets
// @access  Private
exports.getPassengerTickets = asyncHandler(async (req, res, next) => {
  const passenger = await Passenger.getPassengerById(req.params.id);
  
  if (!passenger) {
    return next(new ErrorResponse(`Passenger not found with id of ${req.params.id}`, 404));
  }
  
  // If not admin and not the passenger
  if (req.user.role !== 'admin' && req.user.passenger_id != req.params.id) {
    return next(new ErrorResponse('Not authorized to access these tickets', 403));
  }
  
  const tickets = await Ticket.getTicketsByPassenger(req.params.id);
  
  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});
