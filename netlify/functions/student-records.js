const borrowService = require('../../shared/services/borrowService');
const { jsonResponse, handleOptions, authenticate } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const user = authenticate(event);
    if (user.role === 'admin' && event.queryStringParameters && event.queryStringParameters.all === 'true') {
      const records = await borrowService.getAllBorrowRecords({
        status: event.queryStringParameters.status
      });
      return jsonResponse(200, { success: true, data: records });
    }

    const records = await borrowService.getStudentBorrowRecords(user.id);
    return jsonResponse(200, { success: true, data: records });
  } catch (err) {
    const status = err.status || 500;
    return jsonResponse(status, { success: false, error: err.message });
  }
};
