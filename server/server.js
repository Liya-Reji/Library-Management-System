const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const { testConnection } = require('../shared/db');
const { runMigration } = require('../database/migrate');

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('Starting Library Management System server...');

  if (process.env.DATABASE_URL) {
    try {
      console.log('Testing PostgreSQL connection...');
      const health = await testConnection();
      if (health.success) {
        console.log('Database connected successfully. Checking schema migrations...');
        await runMigration();
      } else {
        console.warn('PostgreSQL connection check failed:', health.error);
        console.warn('The server will continue running. Ensure DATABASE_URL is valid.');
      }
    } catch (dbErr) {
      console.warn('Database initialization warning:', dbErr.message);
    }
  } else {
    console.warn('WARNING: DATABASE_URL is not set. Database operations will fail.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`Library Management System is running on port ${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

startServer();
