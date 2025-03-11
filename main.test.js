const request = require('supertest');
const app = require("./server.js");


//base url for the api
const API_BASE_URL = 'http://localhost:3000/api';


//test credentials
const testUser = {
  name: 'Test user',
  email: "test@example.com",
  password: "password123"
};

let authToken;
let testUserId;
// let testFlightId;
// let testTicketId;


describe('Flight Management API Tests', () => {

  // Auth tests

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post(`${API_BASE_URL}/auth/register`)
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user_id).toBeDefined();
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.role).toBe('passenger');
      
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
      expect(response.body.data.user_id).toBe(testUserId);
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.email).toBe(testUser.email);
    });
    
    it('should reject unauthorized requests', async () => {
      await request(app)
        .get(`${API_BASE_URL}/auth/me`)
        .expect(401);
    });
  });
  
});