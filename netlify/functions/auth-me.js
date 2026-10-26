const authService = require('../../shared/services/authService');
const { jsonResponse, handleOptions, authenticate } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = authenticate(event);
    const profile = await authService.getUserProfile(user.id);
    return jsonResponse(200, { success: true, data: profile });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
