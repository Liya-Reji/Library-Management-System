// In-memory mock PostgreSQL engine for automated testing without requiring a live Postgres instance

const bcrypt = require('bcryptjs');

function createMockDb() {
  const users = [];
  const books = [];
  const borrowRecords = [];
  let userSeq = 1;
  let bookSeq = 1;
  let recordSeq = 1;

  async function executeQuery(text, params = []) {
    const trimmed = text.trim();

    // 1. SELECT NOW()
    if (/SELECT NOW\(\)/i.test(trimmed)) {
      return { rows: [{ current_time: new Date().toISOString() }] };
    }

    // 2. Check existing user by username or email
    if (/SELECT id, username, email FROM users WHERE LOWER\(username\) = \$1 OR LOWER\(email\) = \$2/i.test(trimmed)) {
      const u = params[0].toLowerCase();
      const e = params[1].toLowerCase();
      const found = users.filter(x => x.username.toLowerCase() === u || x.email.toLowerCase() === e);
      return { rows: found };
    }

    // 3. Insert user
    if (/INSERT INTO users/i.test(trimmed)) {
      const newUser = {
        id: userSeq++,
        name: params[0],
        username: params[1],
        email: params[2],
        password_hash: params[3],
        role: trimmed.includes("'admin'") ? 'admin' : (params[4] || 'student'),
        created_at: new Date()
      };
      users.push(newUser);
      return { rows: [newUser] };
    }

    // 4. Find user by username or email
    if (/SELECT id, name, username, email, password_hash, role, created_at FROM users WHERE LOWER\(username\) = \$1 OR LOWER\(email\) = \$1/i.test(trimmed)) {
      const ident = params[0].toLowerCase();
      const found = users.filter(x => x.username.toLowerCase() === ident || x.email.toLowerCase() === ident);
      return { rows: found };
    }

    // 5. Find user by id
    if (/SELECT id, name, username, email, role, created_at FROM users WHERE id = \$1/i.test(trimmed)) {
      const found = users.filter(x => x.id === parseInt(params[0], 10));
      return { rows: found };
    }

    // 6. User check for issue
    if (/SELECT id, name, username, role FROM users WHERE id = \$1/i.test(trimmed)) {
      const found = users.filter(x => x.id === parseInt(params[0], 10));
      return { rows: found };
    }

    // 7. All students
    if (/FROM users u.*WHERE u\.role = 'student'/is.test(trimmed)) {
      const students = users.filter(u => u.role === 'student').map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        created_at: u.created_at,
        active_borrows: borrowRecords.filter(r => r.user_id === u.id && r.status === 'issued').length
      }));
      return { rows: students };
    }

    // 8. Stats query
    if (/SELECT.*COUNT\(id\)::int AS total_titles/is.test(trimmed)) {
      const totalTitles = books.length;
      const totalCopies = books.reduce((acc, b) => acc + b.total_copies, 0);
      const availableCopies = books.reduce((acc, b) => acc + b.available_copies, 0);
      const activeLoans = totalCopies - availableCopies;
      return {
        rows: [{
          total_titles: totalTitles,
          total_copies: totalCopies,
          available_copies: availableCopies,
          active_loans: activeLoans
        }]
      };
    }

    // 9. All books query
    if (/SELECT id, title, author, category, isbn, total_copies, available_copies, created_at FROM books WHERE 1=1/i.test(trimmed)) {
      let filtered = [...books];
      if (params.length > 0) {
        // category or search check
        for (const p of params) {
          if (p.startsWith('%') && p.endsWith('%')) {
            const term = p.slice(1, -1).toLowerCase();
            filtered = filtered.filter(b =>
              b.title.toLowerCase().includes(term) ||
              b.author.toLowerCase().includes(term) ||
              b.isbn.toLowerCase().includes(term)
            );
          } else {
            filtered = filtered.filter(b => b.category === p);
          }
        }
      }
      return { rows: filtered.reverse() };
    }

    // 10. Book by id / lock book row (SELECT only)
    if (/^SELECT.*FROM books WHERE id = \$1/i.test(trimmed)) {
      const found = books.filter(b => b.id === parseInt(params[0], 10));
      return { rows: found };
    }

    // 11. ISBN check
    if (/SELECT id FROM books WHERE UPPER\(isbn\) = \$1/i.test(trimmed)) {
      const isbnUpper = params[0].toUpperCase();
      let found = books.filter(b => b.isbn.toUpperCase() === isbnUpper);
      if (params.length > 1) {
        const excludeId = parseInt(params[1], 10);
        found = found.filter(b => b.id !== excludeId);
      }
      return { rows: found };
    }

    // 12. Insert book
    if (/INSERT INTO books/i.test(trimmed)) {
      const newBook = {
        id: bookSeq++,
        title: params[0],
        author: params[1],
        category: params[2],
        isbn: params[3],
        total_copies: parseInt(params[4], 10),
        available_copies: parseInt(params[5] || params[4], 10),
        created_at: new Date()
      };
      books.push(newBook);
      return { rows: [newBook] };
    }

    // 13. Update book
    if (/UPDATE books\s+SET title =/i.test(trimmed)) {
      const id = parseInt(params[6], 10);
      const b = books.find(x => x.id === id);
      if (b) {
        b.title = params[0];
        b.author = params[1];
        b.category = params[2];
        b.isbn = params[3];
        b.total_copies = parseInt(params[4], 10);
        b.available_copies = parseInt(params[5], 10);
        return { rows: [{ ...b }] };
      }
      return { rows: [] };
    }

    // 14. Decrement available copies
    if (/UPDATE books SET available_copies = available_copies - 1 WHERE id = \$1/i.test(trimmed)) {
      const id = parseInt(params[0], 10);
      const b = books.find(x => x.id === id);
      if (b) b.available_copies -= 1;
      return { rowCount: 1 };
    }

    // 15. Increment available copies
    if (/UPDATE books SET available_copies = available_copies \+ 1 WHERE id = \$1/i.test(trimmed)) {
      const id = parseInt(params[0], 10);
      const b = books.find(x => x.id === id);
      if (b) b.available_copies += 1;
      return { rowCount: 1 };
    }

    // 16. Delete book
    if (/DELETE FROM books WHERE id = \$1/i.test(trimmed)) {
      const id = parseInt(params[0], 10);
      const idx = books.findIndex(x => x.id === id);
      if (idx !== -1) books.splice(idx, 1);
      return { rowCount: 1 };
    }

    // 17. Delete borrow records for book
    if (/DELETE FROM borrow_records WHERE book_id = \$1/i.test(trimmed)) {
      const id = parseInt(params[0], 10);
      for (let i = borrowRecords.length - 1; i >= 0; i--) {
        if (borrowRecords[i].book_id === id) borrowRecords.splice(i, 1);
      }
      return { rowCount: 1 };
    }

    // 18. Check active borrows for book
    if (/SELECT id FROM borrow_records WHERE book_id = \$1 AND status = 'issued'/i.test(trimmed)) {
      const id = parseInt(params[0], 10);
      const active = borrowRecords.filter(r => r.book_id === id && r.status === 'issued');
      return { rows: active };
    }

    // 19. Insert borrow record
    if (/INSERT INTO borrow_records/i.test(trimmed)) {
      const newRecord = {
        id: recordSeq++,
        user_id: parseInt(params[0], 10),
        book_id: parseInt(params[1], 10),
        issue_date: new Date().toISOString().split('T')[0],
        due_date: params[2],
        return_date: null,
        status: 'issued',
        created_at: new Date()
      };
      borrowRecords.push(newRecord);
      return { rows: [newRecord] };
    }

    // 20. Find borrow record by id FOR UPDATE
    if (/SELECT id, user_id, book_id, status FROM borrow_records WHERE id = \$1/i.test(trimmed)) {
      const id = parseInt(params[0], 10);
      const found = borrowRecords.filter(r => r.id === id);
      return { rows: found };
    }

    // 21. Update borrow record to returned
    if (/UPDATE borrow_records\s+SET status = 'returned'/i.test(trimmed)) {
      const id = parseInt(params[0], 10);
      const rec = borrowRecords.find(r => r.id === id);
      if (rec) {
        rec.status = 'returned';
        rec.return_date = new Date().toISOString().split('T')[0];
        return { rows: [{ ...rec }] };
      }
      return { rows: [] };
    }

    // 22. Get student borrow records
    if (/FROM borrow_records br\s+JOIN books b ON br\.book_id = b\.id\s+WHERE br\.user_id = \$1/is.test(trimmed)) {
      const uid = parseInt(params[0], 10);
      const userLoans = borrowRecords
        .filter(r => r.user_id === uid)
        .map(r => {
          const b = books.find(x => x.id === r.book_id) || {};
          return {
            id: r.id,
            book_id: r.book_id,
            book_title: b.title || 'Unknown',
            book_author: b.author || 'Unknown',
            book_category: b.category || 'Unknown',
            book_isbn: b.isbn || 'Unknown',
            issue_date: r.issue_date,
            due_date: r.due_date,
            return_date: r.return_date,
            status: r.status,
            created_at: r.created_at
          };
        });
      return { rows: userLoans };
    }

    // 23. Transaction statements
    if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(trimmed)) {
      return { rows: [] };
    }

    return { rows: [] };
  }

  const mockPool = {
    query: executeQuery,
    connect: async () => ({
      query: executeQuery,
      release: () => {}
    }),
    end: async () => {},
    on: () => {}
  };

  return {
    mockPool,
    users,
    books,
    borrowRecords
  };
}

module.exports = { createMockDb };
