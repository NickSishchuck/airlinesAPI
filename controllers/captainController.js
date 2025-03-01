// controllers/captainController.js
const Captain = require('../models/captainModel');
const Aircraft = require('../models/aircraftModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all captains
// @route   GET /api/captains
// @access  Private/Admin/Staff
exports.getCaptains = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const captains = await Captain.getAllCaptains(page, limit);
  
  res.status(200).json({
    success: true,
    count: captains.data.length,
    pagination: {
      page: captains.page,
      limit: captains.limit,
      totalPages: captains.totalPages,
      totalItems: captains.totalItems
    },
    data: captains.data
  });
});

// @desc    Get single captain
// @route   GET /api/captains/:id
// @access  Private/Admin/Staff
exports.getCaptain = asyncHandler(async (req, res, next) => {
  const captain = await Captain.getCaptainById(req.params.id);
  
  if (!captain) {
    return next(new ErrorResponse(`Captain not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: captain
  });
});

// @desc    Create new captain
// @route   POST /api/captains
// @access  Private/Admin
exports.createCaptain = asyncHandler(async (req, res, next) => {
  // Check if license number already exists
  const exists = await Captain.licenseExists(req.body.license_number);
  
  if (exists) {
    return next(new ErrorResponse('Captain with this license number already exists', 409));
  }
  
  const captainId = await Captain.createCaptain(req.body);
  
  const captain = await Captain.getCaptainById(captainId);
  
  res.status(201).json({
    success: true,
    data: captain
  });
});

// @desc    Update captain
// @route   PUT /api/captains/:id
// @access  Private/Admin
exports.updateCaptain = asyncHandler(async (req, res, next) => {
  let captain = await Captain.getCaptainById(req.params.id);
  
  if (!captain) {
    return next(new ErrorResponse(`Captain not found with id of ${req.params.id}`, 404));
  }
  
  // If changing license, check if it exists
  if (req.body.license_number && req.body.license_number !== captain.license_number) {
    const exists = await Captain.licenseExists(req.body.license_number, req.params.id);
    
    if (exists) {
      return next(new ErrorResponse('Captain with this license number already exists', 409));
    }
  }
  
  const updated = await Captain.updateCaptain(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Captain not found with id of ${req.params.id}`, 404));
  }
  
  captain = await Captain.getCaptainById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: captain
  });
});

// @desc    Delete captain
// @route   DELETE /api/captains/:id
// @access  Private/Admin
exports.deleteCaptain = asyncHandler(async (req, res, next) => {
  const captain = await Captain.getCaptainById(req.params.id);
  
  if (!captain) {
    return next(new ErrorResponse(`Captain not found with id of ${req.params.id}`, 404));
  }
  
  // Check if captain has assigned aircraft
  const aircraft = await Aircraft.getAircraftByCaptain(req.params.id);
  
  if (aircraft.length > 0) {
    return next(new ErrorResponse('Cannot delete captain with assigned aircraft', 400));
  }
  
  await Captain.deleteCaptain(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get captain flights
// @route   GET /api/captains/:id/flights
// @access  Private/Admin/Staff
exports.getCaptainFlights = asyncHandler(async (req, res, next) => {
  const captain = await Captain.getCaptainById(req.params.id);
  
  if (!captain) {
    return next(new ErrorResponse(`Captain not found with id of ${req.params.id}`, 404));
  }
  
  const flights = await Captain.getCaptainFlights(req.params.id);
  
  res.status(200).json({
    success: true,
    count: flights.length,
    data: flights
  });
});