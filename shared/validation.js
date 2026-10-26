// Shared validation helpers for user input

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

function validateUsername(username) {
  if (typeof username !== 'string') return false;
  // 3-30 chars, alphanumeric + underscore
  const re = /^[a-zA-Z0-9_]{3,30}$/;
  return re.test(username.trim());
}

function validateRegistration({ name, username, email, password }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Full name must be between 2 and 100 characters.');
  }

  if (!username || !validateUsername(username)) {
    errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores.');
  }

  if (!email || !validateEmail(email)) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateLogin({ username, password }) {
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    errors.push('Username or email is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateBook({ title, author, category, isbn, total_copies }) {
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 200) {
    errors.push('Title is required and must not exceed 200 characters.');
  }

  if (!author || typeof author !== 'string' || author.trim().length === 0 || author.trim().length > 150) {
    errors.push('Author is required and must not exceed 150 characters.');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0 || category.trim().length > 100) {
    errors.push('Category is required and must not exceed 100 characters.');
  }

  if (!isbn || typeof isbn !== 'string' || isbn.trim().length === 0 || isbn.trim().length > 30) {
    errors.push('ISBN is required and must not exceed 30 characters.');
  }

  const copies = parseInt(total_copies, 10);
  if (isNaN(copies) || copies <= 0) {
    errors.push('Total copies must be a positive integer greater than zero.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateIssue({ user_id, book_id, due_date }) {
  const errors = [];

  const uid = parseInt(user_id, 10);
  if (isNaN(uid) || uid <= 0) {
    errors.push('Valid user ID is required.');
  }

  const bid = parseInt(book_id, 10);
  if (isNaN(bid) || bid <= 0) {
    errors.push('Valid book ID is required.');
  }

  if (!due_date) {
    errors.push('Due date is required.');
  } else {
    const due = new Date(due_date);
    if (isNaN(due.getTime())) {
      errors.push('Invalid due date format.');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today) {
        errors.push('Due date cannot be in the past.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateEmail,
  validateUsername,
  validateRegistration,
  validateLogin,
  validateBook,
  validateIssue
};
