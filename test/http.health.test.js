const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Health Endpoints', () => {
  let app;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('GET /health', () => {
    it('should return 200 with expected shape', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ok: true,
        env: expect.any(String),
        time: expect.any(Number)
      });
    });
  });

  describe('GET /api', () => {
    it('should return 200 with expected shape', async () => {
      const response = await request(app).get('/api');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: expect.any(String),
        version: expect.any(String),
        endpoints: expect.any(Object)
      });
    });
  });
});