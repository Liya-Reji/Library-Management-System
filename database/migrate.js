const fs = require('fs');
const path = require('path');

// Ensure environment variables are loaded reliably from project .env
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const { getClient, closePool } = require('../shared/db');

/**
 * Masks sensitive credentials (passwords) in connection strings for safe diagnostic logging
 */
function sanitizeUrl(urlString) {
  if (!urlString) return '(none)';
  try {
    const parsed = new URL(urlString);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return urlString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  }
}

/**
 * Extracts a meaningful error message across standard Errors, PostgreSQL errors, and Node AggregateErrors
 */
function extractErrorMessage(err) {
  if (!err) return 'Unknown error occurred.';

  // AggregateError from Node net/dns lookup (e.g., dual IPv6/IPv4 failed connects)
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    const subMessages = err.errors.map(e => e.message || e.code || String(e)).filter(Boolean);
    if (subMessages.length > 0) {
      return subMessages.join('; ');
    }
  }

  if (err.message && err.message.trim().length > 0) {
    return err.message.trim();
  }

  if (err.code) {
    return `Connection error (${err.code})`;
  }

  return String(err);
}

/**
 * Provides actionable hints for common database connection and query errors
 */
function getTroubleshootingHint(err) {
  const code = err.code || (err.errors && err.errors[0] && err.errors[0].code);
  switch (code) {
    case 'ECONNREFUSED':
    case 'EACCES':
      return 'PostgreSQL server is not reachable on the configured host and port. Ensure PostgreSQL is running, or start the container with: docker compose up -d postgres';
    case 'ENOTFOUND':
      return 'Database hostname could not be resolved. Check hostname in DATABASE_URL.';
    case 'ETIMEDOUT':
      return 'Connection to PostgreSQL timed out. Check firewall and network connectivity.';
    case '28P01': // invalid_password
      return 'PostgreSQL authentication failed (invalid username or password). Verify credentials in .env.';
    case '3D000': // invalid_catalog_name
      return 'Target database does not exist. Verify the database name in DATABASE_URL.';
    case '28000': // invalid_authorization_specification
      return 'PostgreSQL role does not exist or lacks connection permissions.';
    default:
      return null;
  }
}

async function runMigration() {
  console.log('--- Running Database Schema Migration ---');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Ensure .env file exists with DATABASE_URL or configure it in your environment.');
    process.exit(1);
  }

  let client;
  try {
    client = await getClient();
    console.log('Connected to PostgreSQL successfully.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
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
        console.error('Error during transaction rollback:', extractErrorMessage(rbErr));
      }
    }

    const message = extractErrorMessage(err);
    console.error(`Migration failed: ${message}`);

    // Print helpful diagnostic details safely (no secrets revealed)
    console.error('\nDiagnostic details:');
    console.error(`- Connection target: ${sanitizeUrl(process.env.DATABASE_URL)}`);
    if (err.code) {
      console.error(`- Error code: ${err.code}`);
    }
    if (err.detail) {
      console.error(`- Detail: ${err.detail}`);
    }
    if (err.hint) {
      console.error(`- Hint: ${err.hint}`);
    }
    if (err.position) {
      console.error(`- Query position: ${err.position}`);
    }

    const hint = getTroubleshootingHint(err);
    if (hint) {
      console.error(`- Suggestion: ${hint}`);
    }

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
