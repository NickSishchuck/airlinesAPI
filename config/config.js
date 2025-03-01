// app.js - Express application setup
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Body parser
app.use(express.json());

// Set security HTTP headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/routes', require('./routes/routes'));
app.use('/api/captains', require('./routes/captains'));
app.use('/api/aircraft', require('./routes/aircraft'));
app.use('/api/flights', require('./routes/flights'));
app.use('/api/passengers', require('./routes/passengers'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Airline Transportation API',
    documentation: '/api/docs'
  });
});

// Error handler middleware
app.use(errorHandler);

module.exports = app;
