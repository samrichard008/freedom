import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

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

    // 2. Initialize MySQL connection
    const MYSQL_HOST = process.env.MYSQL_HOST || '51.161.87.124';
    const MYSQL_USER = process.env.MYSQL_USER || 'oneplane_freedom';
    const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '19850108@ASDasd';
    const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'oneplane_freedom';
    const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);

    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      port: MYSQL_PORT,
      connectTimeout: 10000
    });

    let migratedCount = 0;

    try {
      // Ensure the table exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS signatures (
          id VARCHAR(50) PRIMARY KEY,
          full_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          nic VARCHAR(50) UNIQUE NOT NULL,
          phone VARCHAR(50) NOT NULL,
          district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          comment TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
          signature_data_url LONGTEXT,
          created_at VARCHAR(50) NOT NULL,
          verified BOOLEAN DEFAULT TRUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Write batch
      for (const sig of batch) {
        if (!sig.nic) continue;
        const trimmedNic = sig.nic.trim().toUpperCase();
        try {
          // Check duplicate NIC
          const [checkRes]: any = await connection.query('SELECT id FROM signatures WHERE UPPER(nic) = ?', [trimmedNic]);
          if (checkRes && checkRes.length > 0) {
            continue; // Skip duplicates
          }

          await connection.query(
            `INSERT INTO signatures (id, full_name, nic, phone, district, comment, signature_data_url, created_at, verified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sig.id,
              sig.fullName,
              trimmedNic,
              sig.phone || '',
              sig.district || '',
              sig.comment || '',
              sig.signatureDataUrl || '',
              sig.createdAt || new Date().toISOString(),
              sig.verified !== false ? 1 : 0
            ]
          );
          migratedCount++;
        } catch (err) {
          console.warn('[Local Migration] Row insert failed:', sig.id, err);
        }
      }
    } finally {
      await connection.end();
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
