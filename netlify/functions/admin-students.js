const borrowService = require('../../shared/services/borrowService');
const { jsonResponse, handleOptions, requireAdmin } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    requireAdmin(event);
    const students = await borrowService.getAllStudents();
    return jsonResponse(200, { success: true, data: students });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
