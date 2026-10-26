
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

let pool = null;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not defined.'
    );
  }

  // SSL is enabled only when DB_SSL=true.
  const requiresSsl = process.env.DB_SSL === 'true';

  const poolConfig = {
    connectionString,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  if (requiresSsl) {
    poolConfig.ssl = {
      rejectUnauthorized: false,
    };
  } else {
    poolConfig.ssl = false;
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error(
      'Unexpected idle client error on PostgreSQL pool:',
      err.message
    );
  });

  return pool;
}

// Allow overriding the pool for tests and dependency injection.
function setPool(customPool) {
  pool = customPool;
}

async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

async function getClient() {
  const p = getPool();
  return p.connect();
}

async function testConnection() {
  try {
    const res = await query('SELECT NOW() AS current_time');

    return {
      success: true,
      timestamp: res.rows[0].current_time,
    };
  } catch (error) {
    const msg =
      error.message ||
      (error.errors &&
        error.errors
          .map((e) => e.message || e.code)
          .join('; ')) ||
      error.code ||
      String(error);

    return {
      success: false,
      error: msg,
    };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  setPool,
  query,
  getClient,
  testConnection,
  closePool,
};
