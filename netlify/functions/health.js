const { testConnection } = require('../../shared/db');
const { jsonResponse, handleOptions } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const dbHealth = await testConnection();
    const isHealthy = dbHealth.success;

    return jsonResponse(isHealthy ? 200 : 503, {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth.success,
        details: dbHealth.success ? 'PostgreSQL connection active' : dbHealth.error
      }
    });
  } catch (err) {
    return jsonResponse(500, { success: false, error: err.message });
  }
};
