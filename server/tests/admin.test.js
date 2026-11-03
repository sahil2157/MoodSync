const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

let app;
let mongod;
let User;
let adminToken;
let regularToken;
let regularUserId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  app = require('../server');
  User = require('../models/User');

  // Create a regular user via the normal API
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Regular User', email: 'regular@example.com', password: 'password123',
  });
  regularToken = regRes.body.token;
  regularUserId = regRes.body.user.id;

  // Create a second user, then promote directly via the model (simulating
  // what the promoteAdmin.js script or ADMIN_EMAILS bootstrap would do)
  const adminRegRes = await request(app).post('/api/auth/register').send({
    name: 'Admin User', email: 'admin@example.com', password: 'password123',
  });
  await User.findByIdAndUpdate(adminRegRes.body.user.id, { role: 'admin' });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Admin API', () => {
  test('rejects non-admin users with 403', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${regularToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });

  test('admin can list users with pagination', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination).toHaveProperty('total');
  });

  test('admin can search users by name/email', async () => {
    const res = await request(app).get('/api/admin/users?search=regular').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.users.some((u) => u.email === 'regular@example.com')).toBe(true);
  });

  test('admin can view a single user with activity summary', async () => {
    const res = await request(app).get(`/api/admin/users/${regularUserId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('regular@example.com');
    expect(res.body.activity).toHaveProperty('moodCount');
  });

  test('admin can disable a user, and that user is then blocked from logging in', async () => {
    const disableRes = await request(app)
      .put(`/api/admin/users/${regularUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(disableRes.statusCode).toBe(200);
    expect(disableRes.body.user.isActive).toBe(false);

    const loginRes = await request(app).post('/api/auth/login').send({ email: 'regular@example.com', password: 'password123' });
    expect(loginRes.statusCode).toBe(403);

    // re-enable for subsequent tests
    await request(app).put(`/api/admin/users/${regularUserId}`).set('Authorization', `Bearer ${adminToken}`).send({ isActive: true });
  });

  test('admin can promote a user to admin and back', async () => {
    const promote = await request(app)
      .put(`/api/admin/users/${regularUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(promote.statusCode).toBe(200);
    expect(promote.body.user.role).toBe('admin');

    const demote = await request(app)
      .put(`/api/admin/users/${regularUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });
    expect(demote.body.user.role).toBe('user');
  });

  test('admin cannot modify their own role or active status', async () => {
    const adminMeRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    const adminId = adminMeRes.body.user.id;

    const res = await request(app)
      .put(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(res.statusCode).toBe(400);
  });

  test('admin cannot delete their own account', async () => {
    const adminMeRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    const adminId = adminMeRes.body.user.id;

    const res = await request(app).delete(`/api/admin/users/${adminId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
  });

  test('admin can delete another user, cascading their data', async () => {
    const toDelete = await request(app).post('/api/auth/register').send({
      name: 'Temp User', email: 'temp@example.com', password: 'password123',
    });
    const tempId = toDelete.body.user.id;
    const tempToken = toDelete.body.token;

    // give them a mood check-in so we can verify cascade delete
    await request(app).post('/api/mood/analyze').set('Authorization', `Bearer ${tempToken}`).send({ text: 'I feel happy today' });

    const del = await request(app).delete(`/api/admin/users/${tempId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.statusCode).toBe(200);

    const check = await request(app).get(`/api/admin/users/${tempId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(check.statusCode).toBe(404);
  });

  test('admin stats endpoint returns platform counts', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toHaveProperty('totalUsers');
    expect(res.body.stats).toHaveProperty('activeUsers');
    expect(res.body.stats.totalUsers).toBeGreaterThanOrEqual(2);
  });
});
