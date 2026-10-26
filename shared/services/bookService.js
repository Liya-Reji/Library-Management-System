const { query } = require('../db');
const { validateBook } = require('../validation');

async function getAllBooks({ search, category } = {}) {
  let queryText = 'SELECT id, title, author, category, isbn, total_copies, available_copies, created_at FROM books WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    params.push(category);
    queryText += ` AND category = $${params.length}`;
  }

  if (search && search.trim().length > 0) {
    params.push(`%${search.trim().toLowerCase()}%`);
    queryText += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(author) LIKE $${params.length} OR LOWER(isbn) LIKE $${params.length})`;
  }

  queryText += ' ORDER BY id DESC';

  const result = await query(queryText, params);
  return result.rows;
}

async function getBookById(id) {
  const result = await query(
    'SELECT id, title, author, category, isbn, total_copies, available_copies, created_at FROM books WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    const error = new Error('Book not found.');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function addBook({ title, author, category, isbn, total_copies }) {
  const validation = validateBook({ title, author, category, isbn, total_copies });
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const cleanIsbn = isbn.trim().toUpperCase();
  const existingIsbn = await query('SELECT id FROM books WHERE UPPER(isbn) = $1', [cleanIsbn]);
  if (existingIsbn.rows.length > 0) {
    const error = new Error('A book with this ISBN already exists.');
    error.status = 409;
    throw error;
  }

  const copies = parseInt(total_copies, 10);

  const result = await query(
    `INSERT INTO books (title, author, category, isbn, total_copies, available_copies)
     VALUES ($1, $2, $3, $4, $5, $5)
     RETURNING id, title, author, category, isbn, total_copies, available_copies, created_at`,
    [title.trim(), author.trim(), category.trim(), cleanIsbn, copies]
  );

  return result.rows[0];
}

async function updateBook(id, { title, author, category, isbn, total_copies }) {
  const validation = validateBook({ title, author, category, isbn, total_copies });
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const currentBook = await getBookById(id);

  const cleanIsbn = isbn.trim().toUpperCase();
  const isbnCheck = await query('SELECT id FROM books WHERE UPPER(isbn) = $1 AND id != $2', [cleanIsbn, id]);
  if (isbnCheck.rows.length > 0) {
    const error = new Error('Another book already uses this ISBN.');
    error.status = 409;
    throw error;
  }

  const newTotal = parseInt(total_copies, 10);
  const activeLoans = currentBook.total_copies - currentBook.available_copies;

  if (newTotal < activeLoans) {
    const error = new Error(`Cannot set total copies to ${newTotal}. There are currently ${activeLoans} active copy loans.`);
    error.status = 400;
    throw error;
  }

  const newAvailable = newTotal - activeLoans;

  const result = await query(
    `UPDATE books
     SET title = $1, author = $2, category = $3, isbn = $4, total_copies = $5, available_copies = $6
     WHERE id = $7
     RETURNING id, title, author, category, isbn, total_copies, available_copies, created_at`,
    [title.trim(), author.trim(), category.trim(), cleanIsbn, newTotal, newAvailable, id]
  );

  return result.rows[0];
}

async function deleteBook(id) {
  // Check book exists
  await getBookById(id);

  // Check active borrowings
  const activeBorrows = await query(
    "SELECT id FROM borrow_records WHERE book_id = $1 AND status = 'issued'",
    [id]
  );

  if (activeBorrows.rows.length > 0) {
    const error = new Error('Cannot delete this book because copies are currently issued to students.');
    error.status = 400;
    throw error;
  }

  // Delete borrow records associated with this book first if needed, or check
  await query('DELETE FROM borrow_records WHERE book_id = $1', [id]);
  await query('DELETE FROM books WHERE id = $1', [id]);

  return { success: true, message: 'Book deleted successfully.' };
}

async function getLibraryStats() {
  const result = await query(`
    SELECT
      COUNT(id)::int AS total_titles,
      COALESCE(SUM(total_copies), 0)::int AS total_copies,
      COALESCE(SUM(available_copies), 0)::int AS available_copies,
      (COALESCE(SUM(total_copies), 0) - COALESCE(SUM(available_copies), 0))::int AS active_loans
    FROM books
  `);

  return result.rows[0];
}

module.exports = {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getLibraryStats
};
