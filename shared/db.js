const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const forceSsl = process.env.DB_SSL === 'true';
  const requiresSsl = forceSsl || (isProduction && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

  const poolConfig = {
    connectionString,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  if (requiresSsl) {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('Unexpected idle client error on PostgreSQL pool:', err);
  });

  return pool;
}

// Allow overriding pool (useful for tests and dependency injection)
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
    const res = await query('SELECT NOW() as current_time');
    return { success: true, timestamp: res.rows[0].current_time };
  } catch (error) {
    return { success: false, error: error.message };
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
  closePool
};
