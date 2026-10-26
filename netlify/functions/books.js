const bookService = require('../../shared/services/bookService');
const { jsonResponse, handleOptions, parseBody, requireAdmin } = require('./util');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;

  if (event.httpMethod === 'GET') {
    try {
      const params = event.queryStringParameters || {};
      const books = await bookService.getAllBooks({
        search: params.search,
        category: params.category
      });
      return jsonResponse(200, { success: true, data: books });
    } catch (err) {
      const status = err.status || 500;
      return jsonResponse(status, { success: false, error: err.message });
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      requireAdmin(event);
      const bookData = parseBody(event);
      const newBook = await bookService.addBook(bookData);
      return jsonResponse(201, {
        success: true,
        message: 'Book added successfully.',
        data: newBook
      });
    } catch (err) {
      const status = err.status || 500;
      return jsonResponse(status, { success: false, error: err.message });
    }
  }

  return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
};
