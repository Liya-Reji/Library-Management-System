const express = require('express');
const router = express.Router();
const authService = require('../../shared/services/authService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    const result = await authService.registerUser({ name, username, email, password });
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.loginUser({ username, password });
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
