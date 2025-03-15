const { pool } = require('./config/database');

// Close the pool when all tests are done
afterAll(async () => {
  await pool.end();
  console.log('Database pool closed');
});