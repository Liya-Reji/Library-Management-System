const borrowService = require('../../shared/services/borrowService');
const { jsonResponse, handleOptions, parseBody, requireAdmin } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    requireAdmin(event);
    const { record_id } = parseBody(event);
    const result = await borrowService.returnBook(record_id);
    return jsonResponse(200, {
      success: true,
      message: 'Book returned successfully.',
      data: result
    });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
