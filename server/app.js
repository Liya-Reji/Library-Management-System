const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const healthRoutes = require('./routes/healthRoutes');
const bookService = require('../shared/services/bookService');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Direct stats endpoint alias
app.get('/api/stats', async (req, res, next) => {
  try {
    const stats = await bookService.getLibraryStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);

// Direct admin students alias
app.use('/api/admin', borrowRoutes);

// Central Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(`[Server Error] ${req.method} ${req.url}:`, err);
  }

  res.status(status).json({
    success: false,
    error: message
  });
});

module.exports = app;
