// controllers/userController.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  
  // Get users with pagination
  const [rows] = await pool.query(`
    SELECT 
      user_id, name, email, role, created_at, updated_at
    FROM users
    ORDER BY name
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  // Get total count
  const [countRows] = await pool.query('SELECT COUNT(*) as count FROM users');
  const count = countRows[0].count;
  
  res.status(200).json({
    success: true,
    count: rows.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalItems: count
    },
    data: rows
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const [rows] = await pool.query(`
    SELECT 
      user_id, name, email, role, created_at, updated_at
    FROM users
    WHERE user_id = ?
  `, [req.params.id]);
  
  if (rows.length === 0) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
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
  const [result] = await pool.query(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `, [name, email, hashedPassword, role || 'user']);
  
  const [user] = await pool.query(`
    SELECT user_id, name, email, role, created_at, updated_at
    FROM users
    WHERE user_id = ?
  `, [result.insertId]);
  
  res.status(201).json({
    success: true,
    data: user[0]
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  
  // Check if user exists
  const [user] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
  
  if (user.length === 0) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  // Check if email is taken
  if (email && email !== user[0].email) {
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND user_id != ?',
      [email, req.params.id]
    );
    
    if (existingUser.length > 0) {
      return next(new ErrorResponse('Email already in use', 400));
    }
  }
  
  // Prepare update data
  let hashedPassword;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }
  
  // Update user
  await pool.query(`
    UPDATE users
    SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      ${password ? 'password = ?,' : ''}
      role = COALESCE(?, role),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `, [
    name, 
    email, 
    ...(password ? [hashedPassword] : []),
    role,
    req.params.id
  ]);
  
  const [updatedUser] = await pool.query(`
    SELECT user_id, name, email, role, created_at, updated_at
    FROM users
    WHERE user_id = ?
  `, [req.params.id]);
  
  res.status(200).json({
    success: true,
    data: updatedUser[0]
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Check if user exists
  const [user] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
  
  if (user.length === 0) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  // Delete user
  await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});