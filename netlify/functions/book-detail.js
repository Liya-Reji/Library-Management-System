const bookService = require('../../shared/services/bookService');
const { jsonResponse, handleOptions, parseBody, requireAdmin } = require('./util');

function getBookId(event) {
  if (event.queryStringParameters && event.queryStringParameters.id) {
    return event.queryStringParameters.id;
  }
  // Try extracting from path if routed like /api/books/123
  const parts = event.path.split('/');
  const last = parts[parts.length - 1];
  if (last && !isNaN(parseInt(last, 10))) {
    return last;
  }
  return null;
}

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  const id = getBookId(event);
  if (!id) {
    return jsonResponse(400, { success: false, error: 'Book ID parameter is required.' });
  }

  if (event.httpMethod === 'GET') {
    try {
      const book = await bookService.getBookById(id);
      return jsonResponse(200, { success: true, data: book });
    } catch (err) {
      const status = err.status || 500;
      return jsonResponse(status, { success: false, error: err.message });
    }
  }

  if (event.httpMethod === 'PUT') {
    try {
      requireAdmin(event);
      const updateData = parseBody(event);
      const updatedBook = await bookService.updateBook(id, updateData);
      return jsonResponse(200, {
        success: true,
        message: 'Book updated successfully.',
        data: updatedBook
      });
    } catch (err) {
      const status = err.status || 500;
      return jsonResponse(status, { success: false, error: err.message });
    }
  }

  if (event.httpMethod === 'DELETE') {
    try {
      requireAdmin(event);
      const result = await bookService.deleteBook(id);
      return jsonResponse(200, { success: true, message: result.message });
    } catch (err) {
      const status = err.status || 500;
      return jsonResponse(status, { success: false, error: err.message });
    }
  }

  return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
};
