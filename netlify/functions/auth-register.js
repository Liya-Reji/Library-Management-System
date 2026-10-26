const authService = require('../../shared/services/authService');
const { jsonResponse, handleOptions, parseBody } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const { name, username, email, password } = parseBody(event);
    const result = await authService.registerUser({ name, username, email, password });
    return jsonResponse(201, {
      success: true,
      message: 'Registration successful.',
      data: result
    });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
