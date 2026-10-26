const { getClient, query } = require('../db');
const { validateIssue } = require('../validation');

async function issueBook({ user_id, book_id, due_date }) {
  const validation = validateIssue({ user_id, book_id, due_date });
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Verify user exists
    const userRes = await client.query('SELECT id, name, username, role FROM users WHERE id = $1', [user_id]);
    if (userRes.rows.length === 0) {
      const err = new Error('Student user not found.');
      err.status = 404;
      throw err;
    }

    // Lock book row
    const bookRes = await client.query(
      'SELECT id, title, total_copies, available_copies FROM books WHERE id = $1 FOR UPDATE',
      [book_id]
    );

    if (bookRes.rows.length === 0) {
      const err = new Error('Book not found.');
      err.status = 404;
      throw err;
    }

    const book = bookRes.rows[0];

    if (book.available_copies <= 0) {
      const err = new Error(`Cannot issue book "${book.title}". No available copies remaining.`);
      err.status = 400;
      throw err;
    }

    // Decrement available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [book_id]
    );

    // Insert borrow record
    const insertRes = await client.query(
      `INSERT INTO borrow_records (user_id, book_id, issue_date, due_date, status)
       VALUES ($1, $2, CURRENT_DATE, $3, 'issued')
       RETURNING id, user_id, book_id, issue_date, due_date, status, created_at`,
      [user_id, book_id, due_date]
    );

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function returnBook(borrowRecordId) {
  const recordId = parseInt(borrowRecordId, 10);
  if (isNaN(recordId) || recordId <= 0) {
    const error = new Error('Valid borrow record ID is required.');
    error.status = 400;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock borrow record
    const recordRes = await client.query(
      'SELECT id, user_id, book_id, status FROM borrow_records WHERE id = $1 FOR UPDATE',
      [recordId]
    );

    if (recordRes.rows.length === 0) {
      const err = new Error('Borrow record not found.');
      err.status = 404;
      throw err;
    }

    const record = recordRes.rows[0];
    if (record.status === 'returned') {
      const err = new Error('This book has already been recorded as returned.');
      err.status = 400;
      throw err;
    }

    // Lock book row
    const bookRes = await client.query(
      'SELECT id, title, total_copies, available_copies FROM books WHERE id = $1 FOR UPDATE',
      [record.book_id]
    );

    if (bookRes.rows.length === 0) {
      const err = new Error('Associated book not found in library catalogue.');
      err.status = 404;
      throw err;
    }

    const book = bookRes.rows[0];
    if (book.available_copies >= book.total_copies) {
      // Data integrity safeguard
      console.warn(`Available copies already equal to total copies for book ID ${book.id}`);
    } else {
      await client.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
        [book.id]
      );
    }

    const updateRes = await client.query(
      `UPDATE borrow_records
       SET status = 'returned', return_date = CURRENT_DATE
       WHERE id = $1
       RETURNING id, user_id, book_id, issue_date, due_date, return_date, status`,
      [recordId]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getStudentBorrowRecords(userId) {
  const result = await query(
    `SELECT
       br.id,
       br.book_id,
       b.title AS book_title,
       b.author AS book_author,
       b.category AS book_category,
       b.isbn AS book_isbn,
       br.issue_date,
       br.due_date,
       br.return_date,
       br.status,
       br.created_at
     FROM borrow_records br
     JOIN books b ON br.book_id = b.id
     WHERE br.user_id = $1
     ORDER BY
       CASE WHEN br.status = 'issued' THEN 0 ELSE 1 END,
       br.id DESC`,
    [userId]
  );

  return result.rows;
}

async function getAllBorrowRecords({ status } = {}) {
  let queryText = `
    SELECT
      br.id,
      br.user_id,
      u.name AS user_name,
      u.username,
      u.email AS user_email,
      br.book_id,
      b.title AS book_title,
      b.author AS book_author,
      b.isbn AS book_isbn,
      br.issue_date,
      br.due_date,
      br.return_date,
      br.status
    FROM borrow_records br
    JOIN users u ON br.user_id = u.id
    JOIN books b ON br.book_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    params.push(status);
    queryText += ` AND br.status = $${params.length}`;
  }

  queryText += `
    ORDER BY
      CASE WHEN br.status = 'issued' THEN 0 ELSE 1 END,
      br.id DESC
  `;

  const result = await query(queryText, params);
  return result.rows;
}

async function getAllStudents() {
  const result = await query(`
    SELECT
      u.id,
      u.name,
      u.username,
      u.email,
      u.created_at,
      COUNT(br.id) FILTER (WHERE br.status = 'issued')::int AS active_borrows
    FROM users u
    LEFT JOIN borrow_records br ON u.id = br.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.username, u.email, u.created_at
    ORDER BY u.id DESC
  `);

  return result.rows;
}

module.exports = {
  issueBook,
  returnBook,
  getStudentBorrowRecords,
  getAllBorrowRecords,
  getAllStudents
};
