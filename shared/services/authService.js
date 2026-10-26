const { query } = require('../db');
const { hashPassword, comparePassword, generateToken } = require('../auth');
const { validateRegistration, validateLogin } = require('../validation');

async function registerUser({ name, username, email, password }) {
  const validation = validateRegistration({ name, username, email, password });
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const cleanName = name.trim();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // Check existing user
  const existingCheck = await query(
    'SELECT id, username, email FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
    [cleanUsername, cleanEmail]
  );

  if (existingCheck.rows.length > 0) {
    const existing = existingCheck.rows[0];
    const isUsername = existing.username.toLowerCase() === cleanUsername;
    const error = new Error(isUsername ? 'Username is already taken.' : 'Email is already registered.');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const insertResult = await query(
    `INSERT INTO users (name, username, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'student')
     RETURNING id, name, username, email, role, created_at`,
    [cleanName, cleanUsername, cleanEmail, hashedPassword]
  );

  const user = insertResult.rows[0];
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    },
    token
  };
}

async function loginUser({ username, password }) {
  const validation = validateLogin({ username, password });
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const cleanIdentifier = username.trim().toLowerCase();

  const userResult = await query(
    'SELECT id, name, username, email, password_hash, role, created_at FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1',
    [cleanIdentifier]
  );

  if (userResult.rows.length === 0) {
    const error = new Error('Invalid username or password.');
    error.status = 401;
    throw error;
  }

  const user = userResult.rows[0];
  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid username or password.');
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    },
    token
  };
}

async function getUserProfile(userId) {
  const userResult = await query(
    'SELECT id, name, username, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  return userResult.rows[0];
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
