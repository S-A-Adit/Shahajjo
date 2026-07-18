const express = require('express');
const db = require('../db');

const router = express.Router();

// Development-only endpoint to clear all tables
router.post('/', (req, res) => {
  try {
    db.exec(`
      DELETE FROM ratings;
      DELETE FROM bookings;
      DELETE FROM notifications;
      DELETE FROM job_requests;
      DELETE FROM workers;
      DELETE FROM customers;
      DELETE FROM users;
      VACUUM;`);
    res.json({ message: 'Database reset complete' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports = router;
