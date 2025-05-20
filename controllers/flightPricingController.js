const Flight = require('../models/flightModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all flight pricing
// @route   GET /api/flight-pricing
// @access  Private/Admin
exports.getFlightPricing = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const pricingRules = await Flight.getAllFlightPricing(page, limit);
  
  res.status(200).json({
    success: true,
    data: pricingRules.data,
    pagination: {
      total: pricingRules.totalItems,
      page: pricingRules.page,
      limit: pricingRules.limit,
      totalPages: pricingRules.totalPages
    }
  });
});

// @desc    Get single flight pricing
// @route   GET /api/flight-pricing/:id
// @access  Private/Admin
exports.getSingleFlightPricing = asyncHandler(async (req, res, next) => {
  const pricingRule = await Flight.getFlightPricingById(req.params.id);
  
  if (!pricingRule) {
    return next(new ErrorResponse(`Flight pricing not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: pricingRule
  });
});

// @desc    Search flight pricing by origin and/or destination
// @route   GET /api/flight-pricing/search
// @access  Private/Admin
exports.searchFlightPricing = asyncHandler(async (req, res, next) => {
  const { origin, destination } = req.query;
  
  // At least one of origin or destination must be provided
  if (!origin && !destination) {
    return next(new ErrorResponse('Please provide at least one of origin or destination', 400));
  }
  
  const pricingRules = await Flight.searchFlightPricing(origin, destination);
  
  res.status(200).json({
    success: true,
    data: pricingRules
  });
});

// @desc    Create new flight pricing
// @route   POST /api/flight-pricing
// @access  Private/Admin
exports.createFlightPricing = asyncHandler(async (req, res, next) => {
  // For creating a new flight pricing, we'll need to create a new flight
  // with the specified route, base price, and multipliers
  // This is a simplified implementation and should be expanded based on your needs
  const { 
    origin, 
    destination, 
    base_price, 
    economy_multiplier, 
    business_multiplier, 
    first_multiplier, 
    woman_only_multiplier 
  } = req.body;
  
  // Validate required fields
  if (!origin || !destination || !base_price) {
    return next(new ErrorResponse('Please provide origin, destination and base_price', 400));
  }
  
  // Validate airport codes
  if (!/^[A-Z]{3}$/i.test(origin) || !/^[A-Z]{3}$/i.test(destination)) {
    return next(new ErrorResponse('Origin and destination must be valid airport codes (3 letters)', 400));
  }
  
  // Validate base price is positive
  if (base_price <= 0) {
    return next(new ErrorResponse('base_price must be a positive number', 400));
  }
  
  // Check if the route exists
  const [routeRows] = await pool.query('SELECT route_id FROM routes WHERE origin = ? AND destination = ?', [origin, destination]);
  
  if (routeRows.length === 0) {
    return next(new ErrorResponse('Route does not exist. Please create the route first.', 404));
  }
  
  const route_id = routeRows[0].route_id;
  
  // Create a new flight with the pricing information
  // Note: This is simplified and would need to be adapted to your specific requirements
  const [result] = await pool.query(`
    INSERT INTO flights (
      flight_number, 
      route_id, 
      base_price, 
      economy_class_multiplier,
      business_class_multiplier, 
      first_class_multiplier, 
      woman_only_multiplier
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    `PR${Date.now().toString().substring(6)}`, // Generate a unique flight number
    route_id,
    base_price,
    economy_multiplier || 1.0,
    business_multiplier || 2.5,
    first_multiplier || 4.0,
    woman_only_multiplier || 1.2
  ]);
  
  const flightId = result.insertId;
  
  // Get the newly created flight pricing
  const pricingRule = await Flight.getFlightPricingById(flightId);
  
  res.status(201).json({
    success: true,
    message: 'Pricing rule created successfully',
    data: pricingRule
  });
});

// @desc    Update flight pricing
// @route   PUT /api/flight-pricing/:id
// @access  Private/Admin
exports.updateFlightPricing = asyncHandler(async (req, res, next) => {
  let pricingRule = await Flight.getFlightPricingById(req.params.id);
  
  if (!pricingRule) {
    return next(new ErrorResponse(`Flight pricing not found with id of ${req.params.id}`, 404));
  }
  
  // Validate multipliers are positive numbers
  const multipliers = ['economy_multiplier', 'business_multiplier', 'first_multiplier', 'woman_only_multiplier'];
  for (const multiplier of multipliers) {
    if (req.body[multiplier] && req.body[multiplier] <= 0) {
      return next(new ErrorResponse(`${multiplier} must be a positive number`, 400));
    }
  }
  
  // Validate base price is positive
  if (req.body.base_price && req.body.base_price <= 0) {
    return next(new ErrorResponse('base_price must be a positive number', 400));
  }
  
  const updated = await Flight.updateFlightPricing(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Flight pricing not found with id of ${req.params.id}`, 404));
  }
  
  pricingRule = await Flight.getFlightPricingById(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Pricing rule updated successfully',
    data: pricingRule
  });
});

// @desc    Delete flight pricing
// @route   DELETE /api/flight-pricing/:id
// @access  Private/Admin
exports.deleteFlightPricing = asyncHandler(async (req, res, next) => {
  // Since flight pricing is part of the flight data, we can't delete just the pricing
  // This would need to delete the entire flight or reset pricing to defaults
  
  const pricingRule = await Flight.getFlightPricingById(req.params.id);
  
  if (!pricingRule) {
    return next(new ErrorResponse(`Flight pricing not found with id of ${req.params.id}`, 404));
  }
  
  // Reset pricing to defaults instead of deleting
  await Flight.updateFlightPricing(req.params.id, {
    base_price: null,
    economy_multiplier: 1.0,
    business_multiplier: 2.5,
    first_multiplier: 4.0,
    woman_only_multiplier: 1.2
  });
  
  res.status(200).json({
    success: true,
    message: 'Pricing rule deleted successfully'
  });
});

// @desc    Get pricing for a specific flight
// @route   GET /api/flights/:id/pricing
// @access  Public
exports.getFlightPricingByFlightId = asyncHandler(async (req, res, next) => {
  const flight = await Flight.getFlightById(req.params.id);
  
  if (!flight) {
    return next(new ErrorResponse(`Flight not found with id of ${req.params.id}`, 404));
  }
  
  // Calculate prices based on base price and multipliers
  const prices = {
    economy: parseFloat(flight.base_price) * parseFloat(flight.economy_class_multiplier || 1.0),
    business: parseFloat(flight.base_price) * parseFloat(flight.business_class_multiplier || 2.5),
    first: parseFloat(flight.base_price) * parseFloat(flight.first_class_multiplier || 4.0),
    woman_only: parseFloat(flight.base_price) * parseFloat(flight.woman_only_multiplier || 1.2)
  };
  
  const pricingData = {
    flight_id: flight.flight_id,
    flight_number: flight.flight_number,
    origin: flight.origin,
    destination: flight.destination,
    base_price: parseFloat(flight.base_price),
    economy_multiplier: parseFloat(flight.economy_class_multiplier || 1.0),
    business_multiplier: parseFloat(flight.business_class_multiplier || 2.5),
    first_multiplier: parseFloat(flight.first_class_multiplier || 4.0),
    woman_only_multiplier: parseFloat(flight.woman_only_multiplier || 1.2),
    prices
  };
  
  res.status(200).json({
    success: true,
    data: pricingData
  });
});