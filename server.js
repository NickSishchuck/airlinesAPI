// server.js - Main entry point
const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');

// Connect to database
connectDB();

const PORT = config.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});