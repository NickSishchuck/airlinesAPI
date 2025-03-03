// app.js - Express application setup
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Body parser
app.use(express.json());

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
