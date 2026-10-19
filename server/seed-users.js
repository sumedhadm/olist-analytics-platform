import bcrypt from 'bcryptjs';
import pool from './db.js';

const users = [
  { email: 'admin@olist.dev', password: 'Admin@123', role: 'admin' },
  { email: 'viewer@olist.dev', password: 'Viewer@123', role: 'viewer' },
];

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING`,
    [u.email, hash, u.role]
  );
  console.log('Added', u.email);
}

await pool.end();