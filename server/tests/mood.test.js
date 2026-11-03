const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

let app;
let mongod;
let token;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  app = require('../server');

  const res = await request(app).post('/api/auth/register').send({
    name: 'Mood Tester', email: 'mood@example.com', password: 'password123',
  });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Mood API', () => {
  test('quick mood button stores a mood without any text', async () => {
    const res = await request(app)
      .post('/api/mood/quick')
      .set('Authorization', `Bearer ${token}`)
      .send({ emotion: 'sad' });
    expect(res.statusCode).toBe(201);
    expect(res.body.mood.emotion).toBe('sad');
    expect(res.body.mood.source).toBe('quick_button');

    const latest = await request(app).get('/api/mood/latest').set('Authorization', `Bearer ${token}`);
    expect(latest.body.mood.emotion).toBe('sad');
  });

  test('quick mood rejects unknown emotions', async () => {
    const res = await request(app)
      .post('/api/mood/quick')
      .set('Authorization', `Bearer ${token}`)
      .send({ emotion: 'banana' });
    expect(res.statusCode).toBe(400);
  });

  test('analyzes mood text and stores it', async () => {
    const res = await request(app)
      .post('/api/mood/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'I feel very anxious about my exams tomorrow' });

    expect(res.statusCode).toBe(201);
    expect(res.body.mood.emotion).toBe('anxious');
    expect(res.body.mood.interpretation).toMatch(/not a medical/i);
  });

  test('rejects empty mood text', async () => {
    const res = await request(app)
      .post('/api/mood/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '' });
    expect(res.statusCode).toBe(400);
  });

  test('returns mood history', async () => {
    const res = await request(app).get('/api/mood/history').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.moods.length).toBeGreaterThan(0);
  });

  test('requires auth', async () => {
    const res = await request(app).get('/api/mood/history');
    expect(res.statusCode).toBe(401);
  });
});
