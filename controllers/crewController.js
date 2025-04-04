const Crew = require('../models/crewModel');
const Aircraft = require('../models/aircraftModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all crews
// @route   GET /api/crews
// @access  Private/Admin/Staff
exports.getCrews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const status = req.query.status;
  
  const crews = await Crew.getAllCrews(page, limit, status);
  
  res.status(200).json({
    success: true,
    count: crews.data.length,
    pagination: {
      page: crews.page,
      limit: crews.limit,
      totalPages: crews.totalPages,
      totalItems: crews.totalItems
    },
    data: crews.data
  });
});

// @desc    Get single crew
// @route   GET /api/crews/:id
// @access  Private/Admin/Staff
exports.getCrew = asyncHandler(async (req, res, next) => {
  const crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: crew
  });
});

// @desc    Create new crew
// @route   POST /api/crews
// @access  Private/Admin
exports.createCrew = asyncHandler(async (req, res, next) => {
  const crewId = await Crew.createCrew(req.body);
  
  const crew = await Crew.getCrewById(crewId);
  
  res.status(201).json({
    success: true,
    data: crew
  });
});

// @desc    Update crew
// @route   PUT /api/crews/:id
// @access  Private/Admin
exports.updateCrew = asyncHandler(async (req, res, next) => {
  let crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  const updated = await Crew.updateCrew(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  crew = await Crew.getCrewById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: crew
  });
});

// @desc    Delete crew
// @route   DELETE /api/crews/:id
// @access  Private/Admin
exports.deleteCrew = asyncHandler(async (req, res, next) => {
  const crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  // Check if crew has assigned aircraft
  const aircraft = await Aircraft.getAircraftByCrew(req.params.id);
  
  if (aircraft.length > 0) {
    return next(new ErrorResponse('Cannot delete crew with assigned aircraft', 400));
  }
  
  await Crew.deleteCrew(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get crew members
// @route   GET /api/crews/:id/members
// @access  Private/Admin/Staff
exports.getCrewMembers = asyncHandler(async (req, res, next) => {
  const crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  const members = await Crew.getCrewMembers(req.params.id);
  
  res.status(200).json({
    success: true,
    count: members.length,
    data: members
  });
});

// @desc    Assign crew member
// @route   POST /api/crews/:id/members
// @access  Private/Admin
exports.assignCrewMember = asyncHandler(async (req, res, next) => {
  const { crew_member_id } = req.body;
  
  if (!crew_member_id) {
    return next(new ErrorResponse('Please provide crew_member_id', 400));
  }
  
  const crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  const assigned = await Crew.assignCrewMember(req.params.id, crew_member_id);
  
  if (!assigned) {
    return next(new ErrorResponse('Crew member is already assigned to this crew', 400));
  }
  
  const members = await Crew.getCrewMembers(req.params.id);
  
  res.status(200).json({
    success: true,
    count: members.length,
    data: members
  });
});

// @desc    Remove crew member
// @route   DELETE /api/crews/:id/members/:memberId
// @access  Private/Admin
exports.removeCrewMember = asyncHandler(async (req, res, next) => {
  const crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  const removed = await Crew.removeCrewMember(req.params.id, req.params.memberId);
  
  if (!removed) {
    return next(new ErrorResponse(`Crew member not found in this crew`, 404));
  }
  
  const members = await Crew.getCrewMembers(req.params.id);
  
  res.status(200).json({
    success: true,
    count: members.length,
    data: members
  });
});

// @desc    Get aircraft assigned to crew
// @route   GET /api/crews/:id/aircraft
// @access  Private/Admin/Staff
exports.getCrewAircraft = asyncHandler(async (req, res, next) => {
  const crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  const aircraft = await Crew.getCrewAircraft(req.params.id);
  
  res.status(200).json({
    success: true,
    count: aircraft.length,
    data: aircraft
  });
});

// @desc    Validate crew composition
// @route   GET /api/crews/:id/validate
// @access  Private/Admin/Staff
exports.validateCrew = asyncHandler(async (req, res, next) => {
  const crew = await Crew.getCrewById(req.params.id);
  
  if (!crew) {
    return next(new ErrorResponse(`Crew not found with id of ${req.params.id}`, 404));
  }
  
  const validationResult = await Crew.validateCrewComposition(req.params.id);
  
  res.status(200).json({
    success: true,
    data: validationResult
  });
});