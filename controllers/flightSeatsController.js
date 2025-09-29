const FlightSeats = require('../models/flightSeatsModel');
const Flight = require('../models/flightModel');
const Aircraft = require('../models/aircraftModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Initialize seats for a flight
// @route   POST /api/flight-seats/:flightId/initialize
// @access  Private/Admin/Staff
exports.initializeFlightSeats = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.flightId);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.flightId}`, 404));
  }
  
  // Check if seats are already initialized
  const seatMap = await FlightSeats.getFlightSeatMap(req.params.flightId);
  if (Object.keys(seatMap).length > 0) {
    return next(new ErrorResponse('Seats are already initialized for this flight', 400));
  }
  
  try {
    await FlightSeats.initializeFlightSeats(req.params.flightId, flight.aircraft_id);
    
    const updatedSeatMap = await FlightSeats.getFlightSeatMap(req.params.flightId);
    
    res.status(201).json({
      success: true,
      message: 'Flight seats initialized successfully',
      data: {
        flight_id: req.params.flightId,
        seat_map: updatedSeatMap
      }
    });
  } catch (error) {
    return next(new ErrorResponse(`Error initializing seats: ${error.message}`, 500));
  }
});

// @desc    Get seat map for a flight
// @route   GET /api/flight-seats/:flightId/seat-map
// @access  Public
exports.getFlightSeatMap = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.flightId);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.flightId}`, 404));
  }
  
  const seatMap = await FlightSeats.getFlightSeatMap(req.params.flightId);
  
  const seatStats = {};
  let totalAvailable = 0;
  let totalBooked = 0;
  
  for (const [className, seats] of Object.entries(seatMap)) {
    const available = seats.available.length;
    const booked = seats.booked.length;
    const total = available + booked;
    
    seatStats[className] = {
      available,
      booked,
      total,
      occupancy_percentage: total > 0 ? Math.round((booked / total) * 100) : 0
    };
    
    totalAvailable += available;
    totalBooked += booked;
  }
  
  const prices = {};
  if (flight.base_price) {
    prices.economy = parseFloat(flight.base_price) * parseFloat(flight.economy_class_multiplier || 1.0);
    prices.business = parseFloat(flight.base_price) * parseFloat(flight.business_class_multiplier || 2.5);
    prices.first = parseFloat(flight.base_price) * parseFloat(flight.first_class_multiplier || 4.0);
    prices.woman_only = parseFloat(flight.base_price) * parseFloat(flight.woman_only_multiplier || 1.2);
  }
  
  res.status(200).json({
    success: true,
    data: {
      flight_id: req.params.flightId,
      flight_number: flight.flight_number,
      seat_map: seatMap,
      stats: {
        by_class: seatStats,
        total: {
          available: totalAvailable,
          booked: totalBooked,
          total: totalAvailable + totalBooked,
          occupancy_percentage: (totalAvailable + totalBooked) > 0 ? 
            Math.round((totalBooked / (totalAvailable + totalBooked)) * 100) : 0
        }
      },
      prices
    }
  });
});

// @desc    Get available seats by class
// @route   GET /api/flight-seats/:flightId/available/:class
// @access  Public
exports.getAvailableSeatsByClass = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.flightId);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.flightId}`, 404));
  }
  
  const seatClass = req.params.class;
  const validClasses = ['economy', 'business', 'first', 'woman_only'];
  
  if (!validClasses.includes(seatClass)) {
    return next(new ErrorResponse(`Invalid seat class: ${seatClass}`, 400));
  }
  
  const availableSeats = await FlightSeats.getAvailableSeatsByClass(req.params.flightId, seatClass);
  
  let price = null;
  if (flight.base_price) {
    const multiplierField = `${seatClass}_class_multiplier`;
    const multiplier = flight[multiplierField] || 
      (seatClass === 'economy' ? 1.0 : 
       seatClass === 'business' ? 2.5 : 
       seatClass === 'first' ? 4.0 : 1.2);
    
    price = parseFloat(flight.base_price) * parseFloat(multiplier);
  }
  
  res.status(200).json({
    success: true,
    count: availableSeats.length,
    data: {
      flight_id: req.params.flightId,
      flight_number: flight.flight_number,
      class: seatClass,
      available_seats: availableSeats,
      price
    }
  });
});

// @desc    Check if a seat is available
// @route   GET /api/flight-seats/:flightId/check/:class/:seatNumber
// @access  Public
exports.checkSeatAvailability = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.flightId);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.flightId}`, 404));
  }
  
  const { class: seatClass, seatNumber } = req.params;
  const validClasses = ['economy', 'business', 'first', 'woman_only'];
  
  if (!validClasses.includes(seatClass)) {
    return next(new ErrorResponse(`Invalid seat class: ${seatClass}`, 400));
  }
  
  const isAvailable = await FlightSeats.isSeatAvailable(req.params.flightId, seatClass, seatNumber);
  
  res.status(200).json({
    success: true,
    data: {
      flight_id: req.params.flightId,
      flight_number: flight.flight_number,
      class: seatClass,
      seat_number: seatNumber,
      is_available: isAvailable
    }
  });
});

// @desc    Validate a seat for a specific user
// @route   POST /api/flight-seats/:flightId/validate
// @access  Private
exports.validateSeat = asyncHandler(async (req, res, next) => {
  const { seatClass, seatNumber } = req.body;
  
  if (!seatClass || !seatNumber) {
    return next(new ErrorResponse('Please provide seat class and seat number', 400));
  }
  
  const flight = await Flight.getFlightById(req.params.flightId);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.flightId}`, 404));
  }
  
  const validClasses = ['economy', 'business', 'first', 'woman_only'];
  
  if (!validClasses.includes(seatClass)) {
    return next(new ErrorResponse(`Invalid seat class: ${seatClass}`, 400));
  }
  
  const isAvailable = await FlightSeats.isSeatAvailable(req.params.flightId, seatClass, seatNumber);
  let genderRestriction = false;
  let genderValid = true;
  
  if (seatClass === 'woman_only') {
    genderRestriction = true;
    genderValid = FlightSeats.validateWomanOnlySeat(req.user.gender);
  }
  
  res.status(200).json({
    success: true,
    data: {
      flight_id: req.params.flightId,
      flight_number: flight.flight_number,
      class: seatClass,
      seat_number: seatNumber,
      is_available: isAvailable,
      gender_restriction: genderRestriction,
      gender_valid: genderValid,
      valid_for_booking: isAvailable && (seatClass !== 'woman_only' || genderValid)
    }
  });
});

// @desc    Reconfigure flight seats
// @route   PUT /api/flight-seats/:flightId/reconfigure
// @access  Private/Admin
exports.reconfigureFlightSeats = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.flightId);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.flightId}`, 404));
  }
  
  const { configuration } = req.body;
  
  if (!configuration) {
    return next(new ErrorResponse('Please provide seat configuration', 400));
  }
  
  try {
    await FlightSeats.reconfigureFlightSeats(req.params.flightId, configuration);
    
    const updatedSeatMap = await FlightSeats.getFlightSeatMap(req.params.flightId);
    
    res.status(200).json({
      success: true,
      message: 'Flight seats reconfigured successfully',
      data: {
        flight_id: req.params.flightId,
        seat_map: updatedSeatMap
      }
    });
  } catch (error) {
    return next(new ErrorResponse(`Error reconfiguring seats: ${error.message}`, 500));
  }
});
