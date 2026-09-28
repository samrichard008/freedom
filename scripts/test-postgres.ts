import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('No POSTGRES_URL or DATABASE_URL found in environment.');
    return;
  }
  console.log('Found connection string. Attempting to connect...');
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT COUNT(*) FROM signatures');
    console.log('SUCCESS! Signature count in Postgres:', res.rows[0].count);
    const sample = await pool.query('SELECT * FROM signatures LIMIT 3');
    console.log('Sample rows:', sample.rows);
  } catch (err) {
    console.error('Failed to query signatures from PostgreSQL:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
