
require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'airline_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'airline_password',
  DB_NAME: process.env.DB_NAME || 'airline_transportation',
  JWT_SECRET: process.env.JWT_SECRET || 'simpleSecretKey123',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d'
};

