const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

let app;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Auth API', () => {
  const user = { name: 'Test User', email: 'test@example.com', password: 'password123' };

  test('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
  });

  test('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.statusCode).toBe(400);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('protects /api/auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('allows /api/auth/me with valid token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    const token = loginRes.body.token;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });
});
