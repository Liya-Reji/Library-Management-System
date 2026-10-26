const { setPool } = require('../shared/db');
const { createMockDb } = require('./mockDb');
const { generateToken } = require('../shared/auth');

const healthHandler = require('../netlify/functions/health').handler;
const statsHandler = require('../netlify/functions/stats').handler;
const authLoginHandler = require('../netlify/functions/auth-login').handler;
const booksHandler = require('../netlify/functions/books').handler;
const bookDetailHandler = require('../netlify/functions/book-detail').handler;

describe('Netlify Serverless Functions Suite', () => {
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

  test('health function returns 200 with JSON payload', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {}
    };

    const response = await healthHandler(event);
    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.database.connected).toBe(true);
  });

  test('stats function returns library statistics', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {}
    };

    const response = await statsHandler(event);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.total_titles).toBeDefined();
  });

  test('books function allows public listing and admin creation', async () => {
    // 1. Admin creates a book via Netlify function
    const createEvent = {
      httpMethod: 'POST',
      headers: {
        'authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Netlify Cloud Patterns',
        author: 'Serverless Expert',
        category: 'Cloud',
        isbn: '978-7777777777',
        total_copies: 3
      })
    };

    const createRes = await booksHandler(createEvent);
    expect(createRes.statusCode).toBe(201);
    const createdBook = JSON.parse(createRes.body).data;
    expect(createdBook.title).toBe('Netlify Cloud Patterns');

    // 2. Public retrieves books via Netlify function
    const getEvent = {
      httpMethod: 'GET',
      queryStringParameters: {},
      headers: {}
    };

    const getRes = await booksHandler(getEvent);
    expect(getRes.statusCode).toBe(200);
    const listBody = JSON.parse(getRes.body);
    expect(listBody.data.length).toBe(1);

    // 3. Admin deletes book via Netlify book-detail function
    const deleteEvent = {
      httpMethod: 'DELETE',
      queryStringParameters: { id: String(createdBook.id) },
      path: `/api/books/${createdBook.id}`,
      headers: {
        'authorization': `Bearer ${adminToken}`
      }
    };

    const deleteRes = await bookDetailHandler(deleteEvent);
    expect(deleteRes.statusCode).toBe(200);
  });

  test('OPTIONS preflight returns 204 with CORS headers', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      headers: {}
    };

    const response = await healthHandler(event);
    expect(response.statusCode).toBe(204);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
