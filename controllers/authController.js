// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config/config');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email and password', 400));
  }
  
  // Check if email already exists
  const [existingUser] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  
  if (existingUser.length > 0) {
    return next(new ErrorResponse('Email already in use', 400));
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create user
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, role || 'passenger']
  );
  
  // Get created user
  const [rows] = await pool.query(
    'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?',
    [result.insertId]
  );
  
  const user = rows[0];
  
  // Create token
  const token = generateToken(user.user_id);
  
  res.status(201).json({
    success: true,
    token,
    data: user
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }
  
  // Check for user
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  
  if (rows.length === 0) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  
  const user = rows[0];
  
  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  
  // Create token
  const token = generateToken(user.user_id);
  
  // Remove password from response
  delete user.password;
  
  res.status(200).json({
    success: true,
    token,
    data: user
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // user is already available in req due to the protect middleware
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Validate inputs
  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }
  
  // Get user with password
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE user_id = ?',
    [req.user.user_id]
  );
  
  const user = rows[0];
  
  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }
  
  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  // Update password
  await pool.query(
    'UPDATE users SET password = ? WHERE user_id = ?',
    [hashedPassword, req.user.user_id]
  );
  
  // Create token
  const token = generateToken(user.user_id);
  
  res.status(200).json({
    success: true,
    token,
    message: 'Password updated successfully'
  });
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});