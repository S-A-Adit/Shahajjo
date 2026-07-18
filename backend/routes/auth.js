const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = 'shahajjo_secret_key_prototype';

router.post('/register', async (req, res) => {
  const { name, phone, password, user_type, service_type, experience_years, hourly_rate, latitude, longitude } = req.body;
  
  if (!name || !phone || !password || !user_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const insertUser = db.prepare('INSERT INTO users (name, phone, password_hash, user_type) VALUES (?, ?, ?, ?)');
    const info = insertUser.run(name, phone, password_hash, user_type);
    const userId = info.lastInsertRowid;

    if (user_type === 'Worker') {
      const insertWorker = db.prepare('INSERT INTO workers (user_id, service_type, latitude, longitude, experience_years, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)');
      insertWorker.run(userId, service_type, latitude, longitude, experience_years, hourly_rate);
    } else if (user_type === 'Customer') {
      const insertCustomer = db.prepare('INSERT INTO customers (user_id, latitude, longitude) VALUES (?, ?, ?)');
      insertCustomer.run(userId, latitude || null, longitude || null);
    }

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    let specificId = null;
    let extraData = {};
    if (user.user_type === 'Worker') {
      const worker = db.prepare('SELECT id, latitude, longitude FROM workers WHERE user_id = ?').get(user.id);
      specificId = worker.id;
      extraData = { latitude: worker.latitude, longitude: worker.longitude };
    } else if (user.user_type === 'Customer') {
      const customer = db.prepare('SELECT id, latitude, longitude FROM customers WHERE user_id = ?').get(user.id);
      specificId = customer.id;
      extraData = { latitude: customer.latitude, longitude: customer.longitude };
    }

    const token = jwt.sign(
      { id: user.id, specificId, user_type: user.user_type, name: user.name, ...extraData },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // set to true in production if https
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ message: 'Logged in successfully', user: { id: user.id, specificId, name: user.name, user_type: user.user_type, ...extraData } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = { router, JWT_SECRET }; // Exporting secret just for use in other routes (middleware)
