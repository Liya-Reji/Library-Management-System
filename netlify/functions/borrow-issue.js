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
    const { user_id, book_id, due_date } = parseBody(event);
    const result = await borrowService.issueBook({ user_id, book_id, due_date });
    return jsonResponse(201, {
      success: true,
      message: 'Book issued successfully.',
      data: result
    });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
