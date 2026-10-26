const authService = require('../../shared/services/authService');
const { jsonResponse, handleOptions, parseBody } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const { username, password } = parseBody(event);
    const result = await authService.loginUser({ username, password });
    return jsonResponse(200, {
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (err) {
    const status = err.status || 401;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
