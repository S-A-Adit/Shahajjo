const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Helper function: Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; 
  return distance;
}

// Create a new job request
router.post('/jobs', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Customer') {
    return res.status(403).json({ error: 'Only customers can create job requests' });
  }
  
  const { service_type, latitude, longitude, scheduled_time, description } = req.body;
  const customer_id = req.user.specificId;

  try {
    const insert = db.prepare('INSERT INTO job_requests (customer_id, service_type, latitude, longitude, scheduled_time, description) VALUES (?, ?, ?, ?, ?, ?)');
    const info = insert.run(customer_id, service_type, latitude, longitude, scheduled_time, description);
    res.status(201).json({ message: 'Job request created', jobId: info.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create job request' });
  }
});

// Get customer's job requests
router.get('/jobs', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Customer') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const jobs = db.prepare('SELECT * FROM job_requests WHERE customer_id = ? ORDER BY created_at DESC').all(req.user.specificId);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Match engine and notifications
router.post('/match/:jobId', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Customer') return res.status(403).json({ error: 'Unauthorized' });
  
  const jobId = req.params.jobId;
  
  try {
    const job = db.prepare('SELECT * FROM job_requests WHERE id = ? AND customer_id = ?').get(jobId, req.user.specificId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ error: 'Job is not open' });

    // Find available workers matching the service type
    const workers = db.prepare('SELECT w.*, u.name, u.phone FROM workers w JOIN users u ON w.user_id = u.id WHERE w.service_type = ? AND w.availability = 1').all(job.service_type);

    let matchedWorkers = [];
    
    // Calculate distance and filter (e.g., < 3km)
    for (let worker of workers) {
      if (worker.latitude && worker.longitude) {
        const distance = calculateDistance(job.latitude, job.longitude, worker.latitude, worker.longitude);
        if (distance < 5) { // within 5 km for prototype
          matchedWorkers.push({
            ...worker,
            distance: parseFloat(distance.toFixed(2))
          });
        }
      }
    }

    // Sort by distance (closest first)
    matchedWorkers.sort((a, b) => a.distance - b.distance);

    // Take top 5 and create notifications
    const topWorkers = matchedWorkers.slice(0, 5);
    const createNotification = db.prepare('INSERT INTO notifications (worker_id, job_request_id, message) VALUES (?, ?, ?)');
    
    for (let worker of topWorkers) {
      // Check if notification already exists to avoid spam
      const existing = db.prepare('SELECT id FROM notifications WHERE worker_id = ? AND job_request_id = ?').get(worker.id, job.id);
      if (!existing) {
        const message = `New ${job.service_type} job nearby (${worker.distance} km). Time: ${job.scheduled_time}.`;
        createNotification.run(worker.id, job.id, message);
      }
    }

    res.json({ message: 'Matching complete', matchedCount: topWorkers.length, workers: topWorkers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Matching engine failed' });
  }
});

// Get customer bookings with rating info
router.get('/bookings', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Customer') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const bookings = db.prepare(`
      SELECT b.*, u.name as worker_name, w.service_type, u.phone as worker_phone,
             (SELECT AVG(r.rating) FROM ratings r WHERE r.worker_id = w.id) as avg_rating,
             rt.rating as submitted_rating, rt.comment as submitted_comment
      FROM bookings b
      JOIN workers w ON b.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      LEFT JOIN ratings rt ON rt.booking_id = b.id
      WHERE b.customer_id = ?
      ORDER BY b.id DESC
    `).all(req.user.specificId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Cancel a job request and its associated bookings
router.post('/cancel/:jobId', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Customer') return res.status(403).json({ error: 'Unauthorized' });

  const jobId = req.params.jobId;
  const customerId = req.user.specificId;

  try {
    db.prepare('BEGIN TRANSACTION').run();

    const job = db.prepare('SELECT * FROM job_requests WHERE id = ? AND customer_id = ?').get(jobId, customerId);
    if (!job) {
      db.prepare('ROLLBACK').run();
      return res.status(404).json({ error: 'Job request not found' });
    }

    // Update job request status
    db.prepare("UPDATE job_requests SET status = 'cancelled' WHERE id = ?").run(jobId);

    // Update associated booking if any
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE job_request_id = ?").run(jobId);

    // Set active notifications for this job to expired
    db.prepare("UPDATE notifications SET status = 'expired' WHERE job_request_id = ? AND status = 'sent'").run(jobId);

    db.prepare('COMMIT').run();
    res.json({ message: 'Job and booking cancelled successfully' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error(error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

// Submit worker rating for a booking
router.post('/bookings/:bookingId/rate', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'Customer') return res.status(403).json({ error: 'Unauthorized' });

  const bookingId = req.params.bookingId;
  const { rating, comment } = req.body;
  const customerId = req.user.specificId;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_id = ?').get(bookingId, customerId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const insertRating = db.prepare(`
      INSERT INTO ratings (booking_id, customer_id, worker_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertRating.run(bookingId, customerId, booking.worker_id, rating, comment || null);

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'This booking has already been rated' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
