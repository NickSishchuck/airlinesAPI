// middleware/rateLimiter.js
// const rateLimit = require('express-rate-limit');

// Create a limiter for API routes
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
  });
  
  // Create a limiter for authentication endpoints
  exports.authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after an hour'
  });