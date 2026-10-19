import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Is the waiter awake?
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Overall numbers
app.get('/api/kpis', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_kpis');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Revenue per month
app.get('/api/revenue-trend', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_monthly_revenue');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Late deliveries
app.get('/api/delivery-summary', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_delivery_summary');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));