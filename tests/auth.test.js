const request = require('supertest');
const app = require('../server/app');
const { setPool } = require('../shared/db');
const { createMockDb } = require('./mockDb');
const { generateToken } = require('../shared/auth');

describe('Authentication & Authorization Suite', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = createMockDb();
    setPool(mockDb.mockPool);
  });

  describe('POST /api/auth/register', () => {
    test('successfully registers a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          username: 's_connor',
          email: 'sarah@college.edu',
          password: 'Password@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('s_connor');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password_hash).toBeUndefined(); // Never expose password hash!
    });

    test('rejects duplicate username with 409 Conflict', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          username: 's_connor',
          email: 'sarah@college.edu',
          password: 'Password@123'
        });

      // Attempt duplicate username
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Sarah',
          username: 's_connor',
          email: 'other@college.edu',
          password: 'Password@123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already taken/i);
    });

    test('rejects invalid email format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          username: 'bad_user',
          email: 'not-an-email',
          password: 'Password@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Connor',
          username: 'jconnor',
          email: 'john@college.edu',
          password: 'SecretPassword123'
        });
    });

    test('successfully logs in with valid username and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'jconnor',
          password: 'SecretPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('john@college.edu');
    });

    test('successfully logs in using email address', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john@college.edu',
          password: 'SecretPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('rejects invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'jconnor',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid username or password/i);
    });

    test('rejects non-existent username with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'ghost_user',
          password: 'SomePassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Role-based Access Control', () => {
    test('protects admin endpoint from unauthenticated visitors (401)', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({
          title: 'Unauthorized Book',
          author: 'Unknown',
          category: 'Fiction',
          isbn: '111-222',
          total_copies: 2
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('protects admin endpoint from students (403 Forbidden)', async () => {
      const studentToken = generateToken({
        id: 10,
        username: 'student1',
        email: 'student1@college.edu',
        role: 'student'
      });

      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Attempted Book',
          author: 'Unknown',
          category: 'Fiction',
          isbn: '111-222',
          total_copies: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/admin/i);
    });

    test('allows admin to access protected endpoints', async () => {
      const adminToken = generateToken({
        id: 1,
        username: 'admin',
        email: 'admin@college.edu',
        role: 'admin'
      });

      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Official Admin Book',
          author: 'Library Staff',
          category: 'Computer Science',
          isbn: '978-0000000001',
          total_copies: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Official Admin Book');
    });
  });
});
