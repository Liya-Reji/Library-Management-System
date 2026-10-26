const request = require('supertest');
const app = require('../server/app');
const { setPool } = require('../shared/db');
const { createMockDb } = require('./mockDb');
const { generateToken } = require('../shared/auth');

describe('Book Catalogue & Management Suite', () => {
  let mockDb;
  let adminToken;

  beforeEach(() => {
    mockDb = createMockDb();
    setPool(mockDb.mockPool);

    adminToken = generateToken({
      id: 1,
      username: 'admin',
      email: 'admin@college.edu',
      role: 'admin'
    });
  });

  test('Public can browse books and view stats without authentication', async () => {
    // Add book via admin
    await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        category: 'Computer Science',
        isbn: '978-0596517748',
        total_copies: 4
      });

    // Public GET /api/books
    const booksRes = await request(app).get('/api/books');
    expect(booksRes.status).toBe(200);
    expect(booksRes.body.success).toBe(true);
    expect(booksRes.body.data.length).toBe(1);

    // Public GET /api/stats
    const statsRes = await request(app).get('/api/stats');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.total_titles).toBe(1);
    expect(statsRes.body.data.total_copies).toBe(4);
    expect(statsRes.body.data.available_copies).toBe(4);
  });

  test('Admin can update book details', async () => {
    const createRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Initial Title',
        author: 'Author A',
        category: 'General',
        isbn: '978-1111111111',
        total_copies: 3
      });

    const bookId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Title',
        author: 'Author A & B',
        category: 'General',
        isbn: '978-1111111111',
        total_copies: 5
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Updated Title');
    expect(updateRes.body.data.total_copies).toBe(5);
  });

  test('Admin can safely delete a book with no active loans', async () => {
    const createRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Temporary Book',
        author: 'Author X',
        category: 'Drama',
        isbn: '978-2222222222',
        total_copies: 2
      });

    const bookId = createRes.body.data.id;

    const deleteRes = await request(app)
      .delete(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toMatch(/deleted/i);

    // Check list is now empty
    const checkRes = await request(app).get('/api/books');
    expect(checkRes.body.data.length).toBe(0);
  });
});
