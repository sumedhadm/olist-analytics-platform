import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import pool from './db.js';
import { requireAuth, requireRole } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];

    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(req.user);
});

app.get('/api/kpis', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_kpis');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/revenue-trend', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_monthly_revenue');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/delivery-summary', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_delivery_summary');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/admin/ping', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome, admin' });
});

// Shortcut for "logged-in users can read a view"
function viewRoute(path, view) {
  app.get(path, requireAuth, async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${view}`);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });
}

viewRoute('/api/category-revenue', 'v_category_revenue');
viewRoute('/api/state-revenue', 'v_state_revenue');
viewRoute('/api/delay-impact', 'v_delay_impact');
viewRoute('/api/seller-scorecard', 'v_seller_scorecard');
// ---------- ADMIN: lookups for the form ----------
app.get('/api/lookup/categories', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT COALESCE(t.product_category_name_english, p.product_category_name, 'unknown') AS category
      FROM products p
      LEFT JOIN category_translation t ON t.product_category_name = p.product_category_name
      ORDER BY 1`);
    res.json(rows.map((r) => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/lookup/products', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.product_id
       FROM products p
       LEFT JOIN category_translation t ON t.product_category_name = p.product_category_name
       WHERE COALESCE(t.product_category_name_english, p.product_category_name, 'unknown') = $1
       ORDER BY p.product_id
       LIMIT 50`,
      [req.query.category || '']
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/lookup/sellers', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT seller_id, seller_city, seller_state FROM sellers ORDER BY seller_state, seller_city LIMIT 200'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Orders added through the form (they use zip prefix 00000 as a marker)
app.get('/api/admin/orders/recent', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.order_id, o.order_status AS status, o.order_purchase_timestamp AS purchased,
             COALESCE(SUM(oi.price), 0)::float8 AS total
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE c.customer_zip_code_prefix = '00000'
      GROUP BY o.order_id
      ORDER BY o.order_purchase_timestamp DESC
      LIMIT 10`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ---------- ADMIN: add an order ----------
app.post('/api/admin/orders', requireAuth, requireRole('admin'), async (req, res) => {
  const {
    product_id, seller_id, state, city, price, freight,
    payment_type, purchase_date, est_days, actual_days,
  } = req.body;

  // 1) Check the input. Never trust the browser.
  const errors = [];
  const priceN = Number(price);
  const freightN = Number(freight === '' || freight == null ? 0 : freight);
  const purchase = new Date(purchase_date);
  const est = Number(est_days);
  const hasActual = actual_days !== '' && actual_days != null;
  const act = Number(actual_days);

  if (!product_id) errors.push('Choose a product');
  if (!seller_id) errors.push('Choose a seller');
  if (!/^[A-Za-z]{2}$/.test(state || '')) errors.push('State must be 2 letters');
  if (!city || !city.trim()) errors.push('City is required');
  if (!(priceN > 0 && priceN < 100000)) errors.push('Price must be above 0 and below 100000');
  if (!(freightN >= 0 && freightN < 10000)) errors.push('Freight must be between 0 and 10000');
  if (isNaN(purchase.getTime())) errors.push('Purchase date is invalid');
  if (!Number.isInteger(est) || est < 1 || est > 120) errors.push('Estimated days must be a whole number from 1 to 120');
  if (hasActual && (!Number.isInteger(act) || act < 1 || act > 180)) errors.push('Actual days must be a whole number from 1 to 180');
  if (!['credit_card', 'boleto', 'voucher', 'debit_card'].includes(payment_type)) errors.push('Invalid payment type');

  if (errors.length) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  // 2) Save everything in one transaction.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const product = await client.query('SELECT 1 FROM products WHERE product_id = $1', [product_id]);
    const seller = await client.query('SELECT 1 FROM sellers WHERE seller_id = $1', [seller_id]);
    if (!product.rowCount || !seller.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Product or seller does not exist' });
    }

    const newId = () => crypto.randomUUID().replace(/-/g, '');
    const customerId = newId();
    const uniqueId = newId();
    const orderId = newId();

    const day = 86400000;
    const estimated = new Date(purchase.getTime() + est * day);
    const delivered = hasActual ? new Date(purchase.getTime() + act * day) : null;
    const status = hasActual ? 'delivered' : 'processing';

    await client.query(
      `INSERT INTO customers (customer_id, customer_unique_id, customer_zip_code_prefix, customer_city, customer_state)
       VALUES ($1, $2, '00000', $3, $4)`,
      [customerId, uniqueId, city.trim().toLowerCase(), state.toUpperCase()]
    );

    await client.query(
      `INSERT INTO orders (order_id, customer_id, order_status, order_purchase_timestamp, order_approved_at,
                           order_delivered_customer_date, order_estimated_delivery_date)
       VALUES ($1, $2, $3, $4, $4, $5, $6)`,
      [orderId, customerId, status, purchase, delivered, estimated]
    );

    await client.query(
      `INSERT INTO order_items (order_id, order_item_id, product_id, seller_id, shipping_limit_date, price, freight_value)
       VALUES ($1, 1, $2, $3, $4, $5, $6)`,
      [orderId, product_id, seller_id, purchase, priceN, freightN]
    );

    await client.query(
      `INSERT INTO order_payments (order_id, payment_sequential, payment_type, payment_installments, payment_value)
       VALUES ($1, 1, $2, 1, $3)`,
      [orderId, payment_type, priceN + freightN]
    );

    await client.query('COMMIT');
    res.status(201).json({ order_id: orderId, status });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not save the order' });
  } finally {
    client.release();
  }
});         

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));