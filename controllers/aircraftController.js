const Aircraft = require('../models/aircraftModel');
const Crew = require('../models/crewModel');
const Flight = require('../models/flightModel');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all aircraft
// @route   GET /api/aircraft
// @access  Private/Admin/Staff
exports.getAircraft = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const aircraft = await Aircraft.getAllAircraft(page, limit);
  
  res.status(200).json({
    success: true,
    count: aircraft.data.length,
    pagination: {
      page: aircraft.page,
      limit: aircraft.limit,
      totalPages: aircraft.totalPages,
      totalItems: aircraft.totalItems
    },
    data: aircraft.data
  });
});

// @desc    Get single aircraft
// @route   GET /api/aircraft/:id
// @access  Private/Admin/Staff
exports.getSingleAircraft = asyncHandler(async (req, res, next) => {
  const aircraft = await Aircraft.getAircraftById(req.params.id);
  
  if (!aircraft) {
    return next(new ErrorResponse(`Aircraft not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: aircraft
  });
});

// @desc    Create new aircraft
// @route   POST /api/aircraft
// @access  Private/Admin
exports.createAircraft = asyncHandler(async (req, res, next) => {
  // Check if registration number already exists
  const exists = await Aircraft.registrationExists(req.body.registration_number);
  
  if (exists) {
    return next(new ErrorResponse('Aircraft with this registration number already exists', 409));
  }
  
  // If crew_id is provided, validate crew
  if (req.body.crew_id) {
    const crew = await Crew.getCrewById(req.body.crew_id);
    
    if (!crew) {
      return next(new ErrorResponse(`Crew not found with id of ${req.body.crew_id}`, 404));
    }
    
    // Validate crew composition
    const validation = await Crew.validateCrewComposition(req.body.crew_id);
    
    if (!validation.valid) {
      return next(new ErrorResponse(`Invalid crew composition: ${validation.messages.join(', ')}`, 400));
    }
    
    // Check if crew is qualified for the aircraft model
    if (req.body.model) {
      const qualified = await Aircraft.isCrewQualifiedForAircraft(req.body.crew_id, req.body.model);
      
      if (!qualified) {
        return next(new ErrorResponse('Crew is not qualified for this aircraft model', 400));
      }
    }
  }
  
  const aircraftId = await Aircraft.createAircraft(req.body);
  
  const aircraft = await Aircraft.getAircraftById(aircraftId);
  
  res.status(201).json({
    success: true,
    data: aircraft
  });
});

// @desc    Update aircraft
// @route   PUT /api/aircraft/:id
// @access  Private/Admin
exports.updateAircraft = asyncHandler(async (req, res, next) => {
  let aircraft = await Aircraft.getAircraftById(req.params.id);
  
  if (!aircraft) {
    return next(new ErrorResponse(`Aircraft not found with id of ${req.params.id}`, 404));
  }
  
  // If changing registration, check if it exists
  if (req.body.registration_number && req.body.registration_number !== aircraft.registration_number) {
    const exists = await Aircraft.registrationExists(req.body.registration_number, req.params.id);
    
    if (exists) {
      return next(new ErrorResponse('Aircraft with this registration number already exists', 409));
    }
  }
  
  // If updating crew_id, validate crew
  if (req.body.crew_id && req.body.crew_id !== aircraft.crew_id) {
    const crew = await Crew.getCrewById(req.body.crew_id);
    
    if (!crew) {
      return next(new ErrorResponse(`Crew not found with id of ${req.body.crew_id}`, 404));
    }
    
    // Validate crew composition
    const validation = await Crew.validateCrewComposition(req.body.crew_id);
    
    if (!validation.valid) {
      return next(new ErrorResponse(`Invalid crew composition: ${validation.messages.join(', ')}`, 400));
    }
    
    // Check if crew is qualified for the aircraft model
    const model = req.body.model || aircraft.model;
    const qualified = await Aircraft.isCrewQualifiedForAircraft(req.body.crew_id, model);
    
    if (!qualified) {
      return next(new ErrorResponse('Crew is not qualified for this aircraft model', 400));
    }
  }
  
  const updated = await Aircraft.updateAircraft(req.params.id, req.body);
  
  if (!updated) {
    return next(new ErrorResponse(`Aircraft not found with id of ${req.params.id}`, 404));
  }
  
  aircraft = await Aircraft.getAircraftById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: aircraft
  });
});

// @desc    Delete aircraft
// @route   DELETE /api/aircraft/:id
// @access  Private/Admin
exports.deleteAircraft = asyncHandler(async (req, res, next) => {
  const aircraft = await Aircraft.getAircraftById(req.params.id);
  
  if (!aircraft) {
    return next(new ErrorResponse(`Aircraft not found with id of ${req.params.id}`, 404));
  }
  
  // Check if aircraft has flights
  const flights = await Aircraft.getAircraftFlights(req.params.id, true);
  
  if (flights.length > 0) {
    return next(new ErrorResponse('Cannot delete aircraft with associated flights', 400));
  }
  
  await Aircraft.deleteAircraft(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get aircraft flights
// @route   GET /api/aircraft/:id/flights
// @access  Private/Admin/Staff
exports.getAircraftFlights = asyncHandler(async (req, res, next) => {
  const aircraft = await Aircraft.getAircraftById(req.params.id);
  
  if (!aircraft) {
    return next(new ErrorResponse(`Aircraft not found with id of ${req.params.id}`, 404));
  }
  
  const flights = await Aircraft.getAircraftFlights(req.params.id);
  
  res.status(200).json({
    success: true,
    count: flights.length,
    data: flights
  });
});