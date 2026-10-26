const bookService = require('../../shared/services/bookService');
const { jsonResponse, handleOptions } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const stats = await bookService.getLibraryStats();
    return jsonResponse(200, { success: true, data: stats });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
