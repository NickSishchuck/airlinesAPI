const CrewMember = require('../models/crewMemberModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all crew members
// @route   GET /api/crew-members
// @access  Private/Admin/Staff
exports.getCrewMembers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const role = req.query.role;
  
  const crewMembers = await CrewMember.getAllCrewMembers(page, limit, role);
  
  res.status(200).json({
    success: true,
    count: crewMembers.data.length,
    pagination: {
      page: crewMembers.page,
      limit: crewMembers.limit,
      totalPages: crewMembers.totalPages,
      totalItems: crewMembers.totalItems
    },
    data: crewMembers.data
  });
});

// @desc    Search crew members by last name
// @route   GET /api/crew-members/search/:lastName
// @access  Private/Admin/Staff
exports.searchCrewMembersByLastName = asyncHandler(async (req, res, next) => {
  const { lastName } = req.params;
  
  if (!lastName) {
    return next(new ErrorResponse('Please provide a last name to search for', 400));
  }
  
  const crewMembers = await CrewMember.searchByLastName(lastName);
  
  res.status(200).json({
    success: true,
    count: crewMembers.length,
    data: crewMembers
  });
});

// @desc    Get single crew member
// @route   GET /api/crew-members/:id
// @access  Private/Admin/Staff
exports.getCrewMember = asyncHandler(async (req, res, next) => {
  const crewMember = await CrewMember.getCrewMemberById(req.params.id);
  
  if (!crewMember) {
    return next(new ErrorResponse(`Crew member not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: crewMember
  });
});

// @desc    Create new crew member
// @route   POST /api/crew-members
// @access  Private/Admin
exports.createCrewMember = asyncHandler(async (req, res, next) => {
  // Check if license number already exists (for captain and pilot roles)
  if ((req.body.role === 'captain' || req.body.role === 'pilot') && req.body.license_number) {
    const exists = await CrewMember.licenseExists(req.body.license_number);
    
    if (exists) {
      return next(new ErrorResponse('Crew member with this license number already exists', 409));
    }
  }
  
  const crewMemberId = await CrewMember.createCrewMember(req.body);
  
  const crewMember = await CrewMember.getCrewMemberById(crewMemberId);
  
  res.status(201).json({
    success: true,
    data: crewMember
  });
});

// @desc    Update crew member
// @route   PUT /api/crew-members/:id
// @access  Private/Admin
exports.updateCrewMember = asyncHandler(async (req, res, next) => {
  let crewMember = await CrewMember.getCrewMemberById(req.params.id);
  
  if (!crewMember) {
    return next(new ErrorResponse(`Crew member not found with id of ${req.params.id}`, 404));
  }
  
  // If changing license, check if it exists (for captain and pilot roles)
  if ((req.body.role === 'captain' || req.body.role === 'pilot' || crewMember.role === 'captain' || crewMember.role === 'pilot') 
      && req.body.license_number && req.body.license_number !== crewMember.license_number) {
    const exists = await CrewMember.licenseExists(req.body.license_number, req.params.id);
    
    if (exists) {
      return next(new ErrorResponse('Crew member with this license number already exists', 409));
    }
  }
  
  const updated = await CrewMember.updateCrewMember(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Crew member not found with id of ${req.params.id}`, 404));
  }
  
  crewMember = await CrewMember.getCrewMemberById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: crewMember
  });
});

// @desc    Delete crew member
// @route   DELETE /api/crew-members/:id
// @access  Private/Admin
exports.deleteCrewMember = asyncHandler(async (req, res, next) => {
  const crewMember = await CrewMember.getCrewMemberById(req.params.id);
  
  if (!crewMember) {
    return next(new ErrorResponse(`Crew member not found with id of ${req.params.id}`, 404));
  }
  
  try {
    await CrewMember.deleteCrewMember(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Get crew member assignments
// @route   GET /api/crew-members/:id/assignments
// @access  Private/Admin/Staff
exports.getCrewMemberAssignments = asyncHandler(async (req, res, next) => {
  const crewMember = await CrewMember.getCrewMemberById(req.params.id);
  
  if (!crewMember) {
    return next(new ErrorResponse(`Crew member not found with id of ${req.params.id}`, 404));
  }
  
  const assignments = await CrewMember.getCrewMemberAssignments(req.params.id);
  
  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments
  });
});

// @desc    Get crew member flights
// @route   GET /api/crew-members/:id/flights
// @access  Private/Admin/Staff
exports.getCrewMemberFlights = asyncHandler(async (req, res, next) => {
  const crewMember = await CrewMember.getCrewMemberById(req.params.id);
  
  if (!crewMember) {
    return next(new ErrorResponse(`Crew member not found with id of ${req.params.id}`, 404));
  }
  
  const flights = await CrewMember.getCrewMemberFlights(req.params.id);
  
  res.status(200).json({
    success: true,
    count: flights.length,
    data: flights
  });
});