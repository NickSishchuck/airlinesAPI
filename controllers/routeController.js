const Route = require('../models/routeModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
exports.getRoutes = asyncHandler(async (req, res, next) => {
  const routes = await Route.getAllRoutes();
  
  res.status(200).json({
    success: true,
    count: routes.length,
    data: routes
  });
});

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Public
exports.getRoute = asyncHandler(async (req, res, next) => {
  const route = await Route.getRouteById(req.params.id);
  
  if (!route) {
    return next(new ErrorResponse(`Route not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: route
  });
});

// @desc    Create new route
// @route   POST /api/routes
// @access  Private/Admin
exports.createRoute = asyncHandler(async (req, res, next) => {
  // Check if route already exists
  const exists = await Route.routeExists(req.body.origin, req.body.destination);
  
  if (exists) {
    return next(new ErrorResponse('Route already exists', 409));
  }
  
  const routeId = await Route.createRoute(req.body);
  
  const route = await Route.getRouteById(routeId);
  
  res.status(201).json({
    success: true,
    data: route
  });
});

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private/Admin
exports.updateRoute = asyncHandler(async (req, res, next) => {
  let route = await Route.getRouteById(req.params.id);
  
  if (!route) {
    return next(new ErrorResponse(`Route not found with id of ${req.params.id}`, 404));
  }
  
  // If changing origin or destination, check for duplicates
  if ((req.body.origin && req.body.origin !== route.origin) || 
      (req.body.destination && req.body.destination !== route.destination)) {
    
    const origin = req.body.origin || route.origin;
    const destination = req.body.destination || route.destination;
    
    const exists = await Route.routeExists(origin, destination, req.params.id);
    
    if (exists) {
      return next(new ErrorResponse('Route with these locations already exists', 409));
    }
  }
  
  const updated = await Route.updateRoute(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Route not found with id of ${req.params.id}`, 404));
  }
  
  route = await Route.getRouteById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: route
  });
});

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private/Admin
exports.deleteRoute = asyncHandler(async (req, res, next) => {
  const route = await Route.getRouteById(req.params.id);
  
  if (!route) {
    return next(new ErrorResponse(`Route not found with id of ${req.params.id}`, 404));
  }
  
  // Check if route has flights
  if (route.flight_count > 0) {
    return next(new ErrorResponse('Cannot delete route with associated flights', 400));
  }
  
  await Route.deleteRoute(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get flights for a route
// @route   GET /api/routes/:id/flights
// @access  Public
exports.getRouteFlights = asyncHandler(async (req, res, next) => {
  const route = await Route.getRouteById(req.params.id);
  
  if (!route) {
    return next(new ErrorResponse(`Route not found with id of ${req.params.id}`, 404));
  }
  
  const flights = await Route.getRouteFlights(req.params.id);
  
  res.status(200).json({
    success: true,
    count: flights.length,
    data: flights
  });
});
