// config/database.js
const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('../utils/logger');

// Create connection pool
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connect to database
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`MySQL Database connected to ${config.DB_HOST}:${config.DB_NAME}`);
    connection.release();
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };