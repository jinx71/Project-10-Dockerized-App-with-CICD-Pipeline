const express = require('express');
const cors = require('cors');
const instrumentsRouter = require('./routes/instruments.routes');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Used by Docker HEALTHCHECK and the CI smoke test
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ success: true, data: { db: 'connected' }, message: 'OK' });
  } catch (err) {
    return res.status(503).json({ success: false, data: { db: 'unreachable' }, message: err.message });
  }
});

app.use('/api/instruments', instrumentsRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Route not found' });
});

module.exports = app;
