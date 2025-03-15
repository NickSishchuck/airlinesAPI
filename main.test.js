const request = require('supertest');
const app = require("./app.js"); // Changed from server.js to app.js since your main Express app is in app.js
const { pool } = require('./config/database');
const logger = require('./utils/logger');

// Base URL for the API
const API_BASE_URL = '/api'; // No need for localhost:3000 when using supertest with app

// Test credentials - using an existing user from your test data
const testUser = {
  name: 'Test User',
  email: "test@example.com",
  password: "password123"
};

// Variables to store auth token and user ID for tests
let authToken;
let testUserId;

// Setup database connection before running tests
beforeAll(async () => {
  try {
    // Create a test user if needed
    // This ensures the test user exists regardless of database state
    await pool.query(`
      INSERT IGNORE INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'user')
    `, [testUser.name, testUser.email, testUser.password]);
    
    logger.info('Test setup complete');
  } catch (error) {
    logger.error('Test setup failed:', error.message);
    // Don't exit - let Jest handle the error
  }
});

// Clean up database connection after all tests
afterAll(async () => {
  try {
    // Optional: Clean up test data
     await pool.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    
    // Close database connection pool
    await pool.end();
    logger.info('Test teardown complete - pool ended');
  } catch (error) {
    logger.error('Test teardown failed:', error.message);
    // Don't exit - let Jest handle the error
  }
});

describe('Flight Management API Tests', () => {

  // Auth tests
  describe('Authentication Endpoints', () => {
    
    // Note: We're expecting 201 status code for registration, not 200
    it('should register a new user', async () => {
      // First ensure user doesn't exist (to avoid conflicts)
      try {
        await pool.query('DELETE FROM users WHERE email = ?', ['new_test@example.com']);
      } catch (error) {
        // Ignore errors here - maybe user doesn't exist yet
      }
      
      const newUser = {
        name: 'New Test User',
        email: 'new_test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post(`${API_BASE_URL}/auth/register`)
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201); // Changed to 201 
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user_id).toBeDefined();
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      
      // Save user ID and token for later tests
      testUserId = response.body.data.user_id;
      authToken = response.body.token;
    });
    
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post(`${API_BASE_URL}/auth/login`)
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      // Update token for later tests
      authToken = response.body.token;
    });
    
    it('should reject login with invalid credentials', async () => {
      await request(app)
        .post(`${API_BASE_URL}/auth/login`)
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });
    
    it('should get the current user profile', async () => {
      const response = await request(app)
        .get(`${API_BASE_URL}/auth/me`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });
    
    it('should reject unauthorized requests', async () => {
      await request(app)
        .get(`${API_BASE_URL}/auth/me`)
        .expect(401);
    });
  });
  

});