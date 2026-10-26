const {
  validateEmail,
  validateUsername,
  validateRegistration,
  validateLogin,
  validateBook,
  validateIssue
} = require('../shared/validation');

describe('Input Validation Suite', () => {
  describe('Email & Username Validation', () => {
    test('validates correct email formats', () => {
      expect(validateEmail('student@college.edu')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.in')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });

    test('validates username rules (3-30 chars, alphanumeric + _)', () => {
      expect(validateUsername('john_doe')).toBe(true);
      expect(validateUsername('alice123')).toBe(true);
      expect(validateUsername('ab')).toBe(false); // too short
      expect(validateUsername('user-with-dashes')).toBe(false); // dash not allowed
      expect(validateUsername('user with spaces')).toBe(false);
    });
  });

  describe('User Registration Validation', () => {
    test('accepts valid registration input', () => {
      const result = validateRegistration({
        name: 'Jane Doe',
        username: 'janedoe',
        email: 'jane@college.edu',
        password: 'securePassword123'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects short passwords (< 6 chars)', () => {
      const result = validateRegistration({
        name: 'Jane Doe',
        username: 'janedoe',
        email: 'jane@college.edu',
        password: '123'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('6 characters'))).toBe(true);
    });

    test('rejects missing or empty name', () => {
      const result = validateRegistration({
        name: ' ',
        username: 'janedoe',
        email: 'jane@college.edu',
        password: 'securePassword123'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Full name'))).toBe(true);
    });
  });

  describe('Book Validation', () => {
    test('accepts valid book data', () => {
      const result = validateBook({
        title: 'Modern Operating Systems',
        author: 'Andrew S. Tanenbaum',
        category: 'Operating Systems',
        isbn: '978-0133591620',
        total_copies: 5
      });
      expect(result.isValid).toBe(true);
    });

    test('rejects zero or negative copies', () => {
      const result = validateBook({
        title: 'Test Title',
        author: 'Test Author',
        category: 'Tech',
        isbn: '1234567890',
        total_copies: 0
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Total copies'))).toBe(true);
    });
  });

  describe('Borrow Issue Validation', () => {
    test('accepts valid issue details with future due date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const result = validateIssue({
        user_id: 1,
        book_id: 2,
        due_date: future.toISOString().split('T')[0]
      });
      expect(result.isValid).toBe(true);
    });

    test('rejects past due date', () => {
      const result = validateIssue({
        user_id: 1,
        book_id: 2,
        due_date: '2020-01-01'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('past'))).toBe(true);
    });
  });
});
