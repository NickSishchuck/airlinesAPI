const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');

connectDB();
const PORT = config.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
