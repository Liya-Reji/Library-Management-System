const express = require('express');
const router = express.Router();
const { testConnection } = require('../../shared/db');

router.get('/health', async (req, res) => {
  const dbHealth = await testConnection();

  const isHealthy = dbHealth.success;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.success,
      details: dbHealth.success ? 'PostgreSQL connection active' : dbHealth.error
    }
  });
});

module.exports = router;
