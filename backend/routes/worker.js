const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Toggle availability
router.post('/availability', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Worker') return res.status(403).json({ error: 'Unauthorized' });

  const { availability } = req.body;
  
  try {
    const update = db.prepare('UPDATE workers SET availability = ? WHERE id = ?');
    update.run(availability ? 1 : 0, req.user.specificId);
    res.json({ message: 'Availability updated', availability });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Get notifications
router.get('/notifications', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Worker') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const notifications = db.prepare('SELECT n.*, j.service_type, j.description, j.scheduled_time FROM notifications n JOIN job_requests j ON n.job_request_id = j.id WHERE n.worker_id = ? ORDER BY n.created_at DESC').all(req.user.specificId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Accept a job
router.post('/notifications/:id/accept', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Worker') return res.status(403).json({ error: 'Unauthorized' });

  const notificationId = req.params.id;
  const workerId = req.user.specificId;

  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND worker_id = ?').get(notificationId, workerId);
    if (!notification) {
      db.prepare('ROLLBACK').run();
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (notification.status !== 'sent') {
      db.prepare('ROLLBACK').run();
      return res.status(400).json({ error: 'Notification is already processed' });
    }

    const job = db.prepare('SELECT * FROM job_requests WHERE id = ?').get(notification.job_request_id);
    if (!job || job.status !== 'open') {
      db.prepare('UPDATE notifications SET status = \'expired\' WHERE id = ?').run(notificationId);
      db.prepare('COMMIT').run();
      return res.status(400).json({ error: 'Job is no longer available' });
    }

    // Update job status
    db.prepare("UPDATE job_requests SET status = 'matched' WHERE id = ?").run(job.id);
    
    // Update notification status
    db.prepare("UPDATE notifications SET status = 'accepted' WHERE id = ?").run(notificationId);
    
    // Create booking
    const insertBooking = db.prepare('INSERT INTO bookings (job_request_id, worker_id, customer_id, start_time) VALUES (?, ?, ?, ?)');
    insertBooking.run(job.id, workerId, job.customer_id, job.scheduled_time);

    // Set other notifications for this job as expired
    db.prepare('UPDATE notifications SET status = \'expired\' WHERE job_request_id = ? AND id != ?').run(job.id, notificationId);

    db.prepare('COMMIT').run();

    res.json({ message: 'Job accepted successfully' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error(error);
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

// Reject a job
router.post('/notifications/:id/reject', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Worker') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const info = db.prepare("UPDATE notifications SET status = 'rejected' WHERE id = ? AND worker_id = ? AND status = 'sent'").run(req.params.id, req.user.specificId);
    if (info.changes === 0) {
      return res.status(400).json({ error: 'Cannot reject this notification' });
    }
    res.json({ message: 'Job rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject job' });
  }
});

// Get worker's jobs/bookings
router.get('/my-jobs', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Worker') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const jobs = db.prepare(`
      SELECT b.*, u.name as customer_name, u.phone as customer_phone, j.service_type, j.description, j.scheduled_time, j.latitude, j.longitude,
             rt.rating as submitted_rating, rt.comment as submitted_comment
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN job_requests j ON b.job_request_id = j.id
      LEFT JOIN ratings rt ON rt.booking_id = b.id
      WHERE b.worker_id = ?
      ORDER BY b.id DESC
    `).all(req.user.specificId);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Fetch average ratings and list of reviews for a worker
router.get('/ratings', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Worker') return res.status(403).json({ error: 'Unauthorized' });

  const workerId = req.user.specificId;

  try {
    const summary = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(id) as total_reviews
      FROM ratings
      WHERE worker_id = ?
    `).get(workerId);

    const reviews = db.prepare(`
      SELECT r.rating, r.comment, r.created_at, u.name as customer_name
      FROM ratings r
      JOIN customers c ON r.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE r.worker_id = ?
      ORDER BY r.created_at DESC
    `).all(workerId);

    res.json({
      avgRating: summary.avg_rating ? parseFloat(summary.avg_rating.toFixed(1)) : 0,
      totalReviews: summary.total_reviews || 0,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings summary' });
  }
});

module.exports = router;
