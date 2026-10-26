const request = require('supertest');
const app = require('../server/app');
const { setPool } = require('../shared/db');
const { createMockDb } = require('./mockDb');
const { generateToken } = require('../shared/auth');

describe('Book Borrowing & Return Suite', () => {
  let mockDb;
  let adminToken;
  let studentToken;
  let studentId;
  let bookId;

  beforeEach(async () => {
    mockDb = createMockDb();
    setPool(mockDb.mockPool);

    adminToken = generateToken({
      id: 1,
      username: 'admin',
      email: 'admin@college.edu',
      role: 'admin'
    });

    // Create a student in DB
    const studentUser = {
      id: 2,
      name: 'Timmy Student',
      username: 'timmy_s',
      email: 'timmy@college.edu',
      role: 'student'
    };
    mockDb.users.push(studentUser);
    studentId = studentUser.id;
    studentToken = generateToken(studentUser);

    // Create a book with 1 copy
    const book = {
      id: 1,
      title: 'Rare Manuscripts',
      author: 'Ancient Scholars',
      category: 'History',
      isbn: '978-9999999999',
      total_copies: 1,
      available_copies: 1,
      created_at: new Date()
    };
    mockDb.books.push(book);
    bookId = book.id;
  });

  test('Issues book to student and decrements available copies', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    const issueRes = await request(app)
      .post('/api/borrow/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: studentId,
        book_id: bookId,
        due_date: futureDate.toISOString().split('T')[0]
      });

    expect(issueRes.status).toBe(201);
    expect(issueRes.body.success).toBe(true);
    expect(issueRes.body.data.status).toBe('issued');

    // Verify book's available copies is now 0
    const bookCheck = await request(app).get(`/api/books/${bookId}`);
    expect(bookCheck.body.data.available_copies).toBe(0);
  });

  test('Prevents issuing when available copies count is 0', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    // Issue the only copy
    await request(app)
      .post('/api/borrow/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: studentId,
        book_id: bookId,
        due_date: futureDate.toISOString().split('T')[0]
      });

    // Attempt second issue for the same book
    const secondIssue = await request(app)
      .post('/api/borrow/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: studentId,
        book_id: bookId,
        due_date: futureDate.toISOString().split('T')[0]
      });

    expect(secondIssue.status).toBe(400);
    expect(secondIssue.body.success).toBe(false);
    expect(secondIssue.body.error).toMatch(/no available copies/i);
  });

  test('Records book return and increments available copies', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    // Issue book
    const issueRes = await request(app)
      .post('/api/borrow/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: studentId,
        book_id: bookId,
        due_date: futureDate.toISOString().split('T')[0]
      });

    const recordId = issueRes.body.data.id;

    // Return book
    const returnRes = await request(app)
      .post('/api/borrow/return')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ record_id: recordId });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.success).toBe(true);
    expect(returnRes.body.data.status).toBe('returned');

    // Verify copies restored
    const bookCheck = await request(app).get(`/api/books/${bookId}`);
    expect(bookCheck.body.data.available_copies).toBe(1);

    // Attempt duplicate return returns 400
    const dupReturn = await request(app)
      .post('/api/borrow/return')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ record_id: recordId });

    expect(dupReturn.status).toBe(400);
    expect(dupReturn.body.error).toMatch(/already.*returned/i);
  });

  test('Student can retrieve their own borrowing records', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    await request(app)
      .post('/api/borrow/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: studentId,
        book_id: bookId,
        due_date: futureDate.toISOString().split('T')[0]
      });

    const res = await request(app)
      .get('/api/borrow/my-records')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].book_title).toBe('Rare Manuscripts');
  });
});
