const express = require('express');
const resetRouter = require('./routes/reset');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const workerRoutes = require('./routes/worker');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/reset', resetRouter);
app.use('/auth', authRoutes.router);
app.use('/customer', customerRoutes);
app.use('/worker', workerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the app for testing
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
