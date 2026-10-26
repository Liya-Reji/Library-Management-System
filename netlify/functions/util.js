const { verifyToken, extractTokenFromHeader } = require('../../shared/auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  };
}

function handleOptions(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }
  return null;
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch (e) {
    return {};
  }
}

function authenticate(event) {
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    const error = new Error('Authentication token required.');
    error.status = 401;
    throw error;
  }

  const user = verifyToken(token);
  if (!user) {
    const error = new Error('Invalid or expired authentication token.');
    error.status = 401;
    throw error;
  }

  return user;
}

function requireAdmin(event) {
  const user = authenticate(event);
  if (user.role !== 'admin') {
    const error = new Error('Access denied. Administrator privileges required.');
    error.status = 403;
    throw error;
  }
  return user;
}

module.exports = {
  CORS_HEADERS,
  jsonResponse,
  handleOptions,
  parseBody,
  authenticate,
  requireAdmin
};
