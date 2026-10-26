const express = require('express');
const router = express.Router();
const bookService = require('../../shared/services/bookService');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public: Get library statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await bookService.getLibraryStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

// Public: Browse books with optional query search/category
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const books = await bookService.getAllBooks({ search, category });
    res.status(200).json({
      success: true,
      data: books
    });
  } catch (err) {
    next(err);
  }
});

// Public: Get single book by ID
router.get('/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    res.status(200).json({
      success: true,
      data: book
    });
  } catch (err) {
    next(err);
  }
});

// Admin only: Add new book
router.post('/', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const book = await bookService.addBook(req.body);
    res.status(201).json({
      success: true,
      message: 'Book added successfully.',
      data: book
    });
  } catch (err) {
    next(err);
  }
});

// Admin only: Update book
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const book = await bookService.updateBook(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Book updated successfully.',
      data: book
    });
  } catch (err) {
    next(err);
  }
});

// Admin only: Delete book
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await bookService.deleteBook(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
