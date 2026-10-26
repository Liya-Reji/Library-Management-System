const readline = require('readline');
const { query, closePool } = require('../shared/db');
const { hashPassword } = require('../shared/auth');
const { validateEmail, validateUsername } = require('../shared/validation');
require('dotenv').config();

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  console.log('====================================================');
  console.log('     Create Administrator Account (Manual Script)   ');
  console.log('====================================================');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  // Allow arguments or env variables or interactive input
  const argName = process.argv[2] || process.env.ADMIN_NAME;
  const argUsername = process.argv[3] || process.env.ADMIN_USERNAME;
  const argEmail = process.argv[4] || process.env.ADMIN_EMAIL;
  const argPassword = process.argv[5] || process.env.ADMIN_PASSWORD;

  const name = argName || (await prompt('Full Name: '));
  const username = argUsername || (await prompt('Username (letters, numbers, underscores): '));
  const email = argEmail || (await prompt('Email Address: '));
  const password = argPassword || (await prompt('Password (min 6 characters): '));

  if (!name || name.length < 2) {
    console.error('Validation error: Name must be at least 2 characters.');
    process.exit(1);
  }

  if (!validateUsername(username)) {
    console.error('Validation error: Invalid username format.');
    process.exit(1);
  }

  if (!validateEmail(email)) {
    console.error('Validation error: Invalid email format.');
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error('Validation error: Password must be at least 6 characters.');
    process.exit(1);
  }

  try {
    const cleanUsername = username.toLowerCase();
    const cleanEmail = email.toLowerCase();

    // Check if user already exists
    const existing = await query(
      'SELECT id, username, email, role FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
      [cleanUsername, cleanEmail]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (user.role === 'admin') {
        console.log(`User "${user.username}" is already an Administrator.`);
      } else {
        await query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
        console.log(`Updated user "${user.username}" (ID: ${user.id}) role to Administrator.`);
      }
      return;
    }

    const hashedPassword = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (name, username, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, name, username, email, role, created_at`,
      [name, cleanUsername, cleanEmail, hashedPassword]
    );

    const admin = result.rows[0];
    console.log('----------------------------------------------------');
    console.log('Administrator account created successfully!');
    console.log(`ID:       ${admin.id}`);
    console.log(`Name:     ${admin.name}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email:    ${admin.email}`);
    console.log(`Role:     ${admin.role}`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Failed to create administrator:', err.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
