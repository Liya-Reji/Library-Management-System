const { query, closePool } = require('../shared/db');
const { hashPassword } = require('../shared/auth');
require('dotenv').config();

async function seedDemoData() {
  console.log('====================================================');
  console.log('       Local Demo Seeding Script (Safe Guard)       ');
  console.log('====================================================');

  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Demo seed script cannot run in production environment!');
    console.error('This script is strictly intended for local demonstration purposes.');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set.');
    process.exit(1);
  }

  try {
    console.log('1. Checking & creating demo student account...');
    const studentUsername = 'student_demo';
    const studentEmail = 'student@example.edu';
    const studentExisting = await query(
      'SELECT id FROM users WHERE LOWER(username) = $1',
      [studentUsername]
    );

    let demoStudentId;
    if (studentExisting.rows.length === 0) {
      const studentHash = await hashPassword('Student@123');
      const studentRes = await query(
        `INSERT INTO users (name, username, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'student')
         RETURNING id`,
        ['Demo Student', studentUsername, studentEmail, studentHash]
      );
      demoStudentId = studentRes.rows[0].id;
      console.log(`   Created demo student account: ${studentUsername} (ID: ${demoStudentId})`);
    } else {
      demoStudentId = studentExisting.rows[0].id;
      console.log(`   Demo student already exists (ID: ${demoStudentId})`);
    }

    console.log('2. Seeding sample library books...');
    const sampleBooks = [
      {
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen, Charles E. Leiserson',
        category: 'Computer Science',
        isbn: '978-0262033848',
        total_copies: 5
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        category: 'Computer Science',
        isbn: '978-0132350884',
        total_copies: 4
      },
      {
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        category: 'Software Engineering',
        isbn: '978-0201633610',
        total_copies: 3
      },
      {
        title: 'Computer Networks: A Systems Approach',
        author: 'Larry L. Peterson, Bruce S. Davie',
        category: 'Networking',
        isbn: '978-0123850591',
        total_copies: 6
      },
      {
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
        category: 'Operating Systems',
        isbn: '978-1119800361',
        total_copies: 4
      },
      {
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
        category: 'Databases',
        isbn: '978-0078022159',
        total_copies: 5
      },
      {
        title: 'The Pragmatic Programmer: Your Journey to Mastery',
        author: 'David Thomas, Andrew Hunt',
        category: 'Software Engineering',
        isbn: '978-0135957059',
        total_copies: 2
      }
    ];

    for (const b of sampleBooks) {
      const existing = await query('SELECT id FROM books WHERE isbn = $1', [b.isbn]);
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO books (title, author, category, isbn, total_copies, available_copies)
           VALUES ($1, $2, $3, $4, $5, $5)`,
          [b.title, b.author, b.category, b.isbn, b.total_copies]
        );
        console.log(`   + Added: "${b.title}" (${b.total_copies} copies)`);
      } else {
        console.log(`   - Exists: "${b.title}"`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('Demo seeding completed successfully!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };
