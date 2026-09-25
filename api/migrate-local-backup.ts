import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const offset = parseInt(req.query.offset as string || '0', 10);
  const limit = parseInt(req.query.limit as string || '1000', 10);

  try {
    // 1. Read JSON backup file
    const backupPath = path.join(process.cwd(), 'public', 'gnanasara_petition_backup.json');
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, error: 'Backup file gnanasara_petition_backup.json not found in public folder.' });
    }

    const rawData = fs.readFileSync(backupPath, 'utf8');
    const allSignatures: any[] = JSON.parse(rawData);

    if (offset >= allSignatures.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        totalInBackup: allSignatures.length,
        message: 'All local backup signatures have been processed.'
      });
    }

    const batch = allSignatures.slice(offset, offset + limit);

    // 2. Initialize PostgreSQL connection
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      return res.status(500).json({ success: false, error: 'PostgreSQL connection string is missing.' });
    }

    const pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    let migratedCount = 0;

    try {
      // Ensure the table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS signatures (
          id VARCHAR(50) PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          nic VARCHAR(50) UNIQUE NOT NULL,
          phone VARCHAR(50) NOT NULL,
          district VARCHAR(100) NOT NULL,
          comment TEXT,
          signature_data_url TEXT,
          created_at VARCHAR(50) NOT NULL,
          verified BOOLEAN DEFAULT TRUE
        );
      `);

      // Write batch
      for (const sig of batch) {
        if (!sig.nic) continue;
        try {
          const insertResult = await client.query(
            `INSERT INTO signatures (id, full_name, nic, phone, district, comment, signature_data_url, created_at, verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (nic) DO NOTHING`,
            [
              sig.id,
              sig.fullName,
              sig.nic.trim().toUpperCase(),
              sig.phone || '',
              sig.district || '',
              sig.comment || '',
              sig.signatureDataUrl || '',
              sig.createdAt || new Date().toISOString(),
              sig.verified !== false
            ]
          );
          if (insertResult.rowCount && insertResult.rowCount > 0) {
            migratedCount++;
          }
        } catch (err) {
          console.warn('[Local Migration] Row insert failed:', sig.id, err);
        }
      }
    } finally {
      client.release();
      await pool.end();
    }

    res.status(200).json({
      success: true,
      count: batch.length,
      migratedCount,
      totalInBackup: allSignatures.length,
      nextOffset: offset + batch.length,
      message: `Processed local backup index ${offset} to ${offset + batch.length}. Newly inserted: ${migratedCount}.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Local backup migration error' });
  }
}
