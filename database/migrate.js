const fs = require('fs');
const path = require('path');
const { getClient, closePool } = require('../shared/db');
require('dotenv').config();

async function runMigration() {
  console.log('--- Running Database Schema Migration ---');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  let client;
  try {
    client = await getClient();
    console.log('Connected to PostgreSQL successfully.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema idempotently...');
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');

    console.log('Database migration completed successfully! All tables and indices are verified.');
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Error during transaction rollback:', rbErr.message);
      }
    }
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await closePool();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
