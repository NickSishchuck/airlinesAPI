const Flight = require('../models/flightModel');
const Aircraft = require('../models/aircraftModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { formatDate } = require('../utils/dateFormat');

// @desc    Get all flights
// @route   GET /api/flights
// @access  Public
exports.getFlights = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const flights = await Flight.getAllFlights(page, limit);
  
  res.status(200).json({
    success: true,
    count: flights.data.length,
    pagination: {
      page: flights.page,
      limit: flights.limit,
      totalPages: flights.totalPages,
      totalItems: flights.totalItems
    },
    data: flights.data
  });
});

// @desc    Get single flight
// @route   GET /api/flights/:id
// @access  Public
exports.getFlight = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.id);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: flight
  });
});

// @desc    Create new flight
// @route   POST /api/flights
// @access  Private/Admin
exports.createFlight = asyncHandler(async (req, res, next) => {
  // Check if aircraft is available for the time period
  const isAvailable = await Flight.isAircraftAvailable(
    req.body.aircraft_id,
    req.body.departure_time,
    req.body.arrival_time
  );
  
  if (!isAvailable) {
    return next(new ErrorResponse('Aircraft is already scheduled for this time period', 409));
  }
  
  // Check if the aircraft has a crew assigned
  const aircraft = await Aircraft.getAircraftById(req.body.aircraft_id);
  
  if (!aircraft) {
    return next(new ErrorResponse(`Aircraft not found with id of ${req.body.aircraft_id}`, 404));
  }
  
  if (!aircraft.crew_id) {
    return next(new ErrorResponse('Aircraft does not have a crew assigned', 400));
  }
  
  // Ensure base_price is provided
  if (!req.body.base_price) {
    return next(new ErrorResponse('Base price is required for flight creation', 400));
  }
  
  const flightId = await Flight.createFlight(req.body);
  
  const flight = await Flight.getFlightById(flightId);
  
  res.status(201).json({
    success: true,
    data: flight
  });
});

// @desc    Update flight
// @route   PUT /api/flights/:id
// @access  Private/Admin
exports.updateFlight = asyncHandler(async (req, res, next) => {
  let flight = await Flight.getFlightById(req.params.id);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.id}`, 404));
  }
  
  // If updating aircraft or times, check availability
  if ((req.body.aircraft_id && req.body.aircraft_id !== flight.aircraft_id) || 
      (req.body.departure_time || req.body.arrival_time)) {
    
    const aircraftId = req.body.aircraft_id || flight.aircraft_id;
    const departureTime = req.body.departure_time || flight.departure_time;
    const arrivalTime = req.body.arrival_time || flight.arrival_time;
    
    const isAvailable = await Flight.isAircraftAvailable(
      aircraftId,
      departureTime,
      arrivalTime,
      req.params.id
    );
    
    if (!isAvailable) {
      return next(new ErrorResponse('Aircraft is already scheduled for this time period', 409));
    }
    
    // If changing aircraft, check if it has a crew assigned
    if (req.body.aircraft_id && req.body.aircraft_id !== flight.aircraft_id) {
      const aircraft = await Aircraft.getAircraftById(req.body.aircraft_id);
      
      if (!aircraft) {
        return next(new ErrorResponse(`Aircraft not found with id of ${req.body.aircraft_id}`, 404));
      }
      
      if (!aircraft.crew_id) {
        return next(new ErrorResponse('Aircraft does not have a crew assigned', 400));
      }
    }
  }
  
  const updated = await Flight.updateFlight(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.id}`, 404));
  }
  
  flight = await Flight.getFlightById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: flight
  });
});

// @desc    Delete flight
// @route   DELETE /api/flights/:id
// @access  Private/Admin
exports.deleteFlight = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.id);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.id}`, 404));
  }
  
  // Check if flight has tickets
  if (flight.booked_seats > 0) {
    return next(new ErrorResponse('Cannot delete flight with booked tickets', 400));
  }
  
  await Flight.deleteFlight(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Search flights by route and date
// @route   GET /api/flights/search/by-route-date
// @access  Public
exports.searchFlightsByRouteAndDate = asyncHandler(async (req, res, next) => {
  const { origin, destination, date } = req.query;
  
  if (!origin || !destination || !date) {
    return next(new ErrorResponse('Please provide origin, destination and date', 400));
  }
  
  const flights = await Flight.searchFlightsByRouteAndDate(origin, destination, date);
  
  res.status(200).json({
    success: true,
    count: flights.length,
    data: flights
  });
});

// @desc    Generate flight schedule
// @route   GET /api/flights/schedule/generate
// @access  Public
exports.generateFlightSchedule = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(new ErrorResponse('Please provide start date and end date', 400));
  }
  
  const schedule = await Flight.generateFlightSchedule(startDate, endDate);
  
  res.status(200).json({
    success: true,
    count: schedule.length,
    data: schedule
  });
});

// @desc    Cancel flight
// @route   PATCH /api/flights/:id/cancel
// @access  Private/Admin
exports.cancelFlight = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.id);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.id}`, 404));
  }
  
  if (flight.status === 'canceled') {
    return next(new ErrorResponse('Flight is already canceled', 400));
  }
  
  if (flight.status === 'arrived') {
    return next(new ErrorResponse('Cannot cancel an arrived flight', 400));
  }
  
  await Flight.updateFlightStatus(req.params.id, 'canceled');
  
  res.status(200).json({
    success: true,
    data: { status: 'canceled' }
  });
});

// @desc    Get flight price classes
// @route   GET /api/flights/:id/prices
// @access  Public
exports.getFlightPrices = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.id);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.id}`, 404));
  }
  
  // Calculate prices for each class
  const prices = {
    economy: parseFloat(flight.base_price),
    business: parseFloat(flight.base_price) * 2.5,
    first: parseFloat(flight.base_price) * 4.0
  };
  
  res.status(200).json({
    success: true,
    data: {
      flight_id: flight.flight_id,
      flight_number: flight.flight_number,
      base_price: flight.base_price,
      prices
    }
  });
});