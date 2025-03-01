// middleware/validator.js
const { check, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

// Process validation results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }
  next();
};

// Flight input validation
exports.validateFlight = [
  check('flight_number')
    .not()
    .isEmpty()
    .withMessage('Flight number is required')
    .matches(/^[A-Z]{2}\d{1,4}$/i)
    .withMessage('Flight number must be in format XX1234'),
  
  check('route_id')
    .isInt({ min: 1 })
    .withMessage('Valid route ID is required'),
  
  check('aircraft_id')
    .isInt({ min: 1 })
    .withMessage('Valid aircraft ID is required'),
  
  check('departure_time')
    .isISO8601()
    .withMessage('Departure time must be a valid date and time'),
  
  check('arrival_time')
    .isISO8601()
    .withMessage('Arrival time must be a valid date and time')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.departure_time)) {
        throw new Error('Arrival time must be after departure time');
      }
      return true;
    }),
  
  validateResults
];

// Ticket input validation
exports.validateTicket = [
  check('passenger_id')
    .isInt({ min: 1 })
    .withMessage('Valid passenger ID is required'),
  
  check('flight_id')
    .isInt({ min: 1 })
    .withMessage('Valid flight ID is required'),
  
  check('seat_number')
    .not()
    .isEmpty()
    .withMessage('Seat number is required')
    .matches(/^\d{1,2}[A-Z]$/i)
    .withMessage('Seat number must be in format like 1A, 24C'),
  
  check('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  check('class')
    .isIn(['economy', 'business', 'first'])
    .withMessage('Class must be economy, business, or first'),
  
  validateResults
];

// Passenger input validation
exports.validatePassenger = [
  check('first_name')
    .not()
    .isEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  check('last_name')
    .not()
    .isEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  check('passport_number')
    .not()
    .isEmpty()
    .withMessage('Passport number is required')
    .matches(/^[A-Z0-9]{6,12}$/i)
    .withMessage('Passport number must be 6-12 alphanumeric characters'),
  
  check('nationality')
    .not()
    .isEmpty()
    .withMessage('Nationality is required'),
  
  check('date_of_birth')
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom(value => {
      const age = (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 0) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),
  
  check('email')
    .optional()
    .isEmail()
    .withMessage('Please include a valid email'),
  
  validateResults
];
