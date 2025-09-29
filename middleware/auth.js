// middleware/auth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');
const { pool } = require('../config/database');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./asyncHandler');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE user_id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return next(new ErrorResponse('User no longer exists', 401));
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
