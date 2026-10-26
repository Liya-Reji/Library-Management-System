const express = require('express');
const router = express.Router();
const borrowService = require('../../shared/services/borrowService');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Student: Get own borrow records
router.get('/my-records', authenticateToken, async (req, res, next) => {
  try {
    const records = await borrowService.getStudentBorrowRecords(req.user.id);
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Get all registered students
router.get('/students', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const students = await borrowService.getAllStudents();
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Get all borrow records
router.get('/records', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const records = await borrowService.getAllBorrowRecords({ status: req.query.status });
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Issue book to student
router.post('/issue', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { user_id, book_id, due_date } = req.body;
    const record = await borrowService.issueBook({ user_id, book_id, due_date });
    res.status(201).json({
      success: true,
      message: 'Book issued successfully.',
      data: record
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Return book
router.post('/return', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { record_id } = req.body;
    const record = await borrowService.returnBook(record_id);
    res.status(200).json({
      success: true,
      message: 'Book returned successfully.',
      data: record
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
