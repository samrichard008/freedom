import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Define the Signature interface
export interface DBResponseSignature {
  id: string;
  fullName: string;
  nic: string;
  phone: string;
  district: string;
  comment?: string;
  signatureDataUrl?: string;
  createdAt: string;
  verified: boolean;
}

const LOCAL_JSON_DB_PATH = path.join(process.cwd(), 'local_signatures_db.json');

// Initialize pg Connection Pool if connection string is provided
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let pool: pg.Pool | null = null;

if (connectionString) {
  console.log('[PostgreSQL] Database connection URL found. Initializing PostgreSQL pool...');
  pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
  });
} else {
  console.log('[LocalDB] No DATABASE_URL or POSTGRES_URL environment variables found.');
  console.log(`[LocalDB] Falling back to robust local JSON database: ${LOCAL_JSON_DB_PATH}`);
}

// Ensure database table exists if using PostgreSQL
export async function ensureDatabaseSetup() {
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        console.log('[PostgreSQL] Ensuring signatures table exists...');
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
        console.log('[PostgreSQL] Signatures table verified successfully!');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[PostgreSQL] Failed to setup PostgreSQL tables:', err);
    }
  } else {
    // Local JSON setup
    if (!fs.existsSync(LOCAL_JSON_DB_PATH)) {
      try {
        fs.writeFileSync(LOCAL_JSON_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
        console.log('[LocalDB] Created fresh local JSON database file.');
      } catch (err) {
        console.error('[LocalDB] Failed to create local JSON database:', err);
      }
    }
  }
}

// Fetch all signatures from DB (PostgreSQL or Local JSON)
export async function getAllNewSignatures(): Promise<DBResponseSignature[]> {
  await ensureDatabaseSetup();

  if (pool) {
    try {
      const { rows } = await pool.query(`
        SELECT 
          id, 
          full_name as "fullName", 
          nic, 
          phone, 
          district, 
          comment, 
          signature_data_url as "signatureDataUrl", 
          created_at as "createdAt", 
          verified 
        FROM signatures 
        ORDER BY created_at DESC
      `);
      return rows;
    } catch (err) {
      console.error('[PostgreSQL] Error fetching signatures, falling back to empty list:', err);
      return [];
    }
  } else {
    try {
      if (fs.existsSync(LOCAL_JSON_DB_PATH)) {
        const fileContent = fs.readFileSync(LOCAL_JSON_DB_PATH, 'utf-8');
        return JSON.parse(fileContent) as DBResponseSignature[];
      }
    } catch (err) {
      console.error('[LocalDB] Error reading local JSON database:', err);
    }
    return [];
  }
}

// Add a new signature
export async function addNewSignature(sig: DBResponseSignature): Promise<{ success: boolean; error?: string }> {
  await ensureDatabaseSetup();
  const trimmedNic = sig.nic.trim().toUpperCase();

  if (pool) {
    try {
      // Check duplicate NIC
      const checkRes = await pool.query('SELECT id FROM signatures WHERE UPPER(nic) = $1', [trimmedNic]);
      if (checkRes.rows.length > 0) {
        return {
          success: false,
          error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සன் කර ඇත / This NIC has already signed this petition.'
        };
      }

      // Insert signature
      await pool.query(
        `INSERT INTO signatures (id, full_name, nic, phone, district, comment, signature_data_url, created_at, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          sig.id,
          sig.fullName,
          trimmedNic,
          sig.phone,
          sig.district,
          sig.comment || '',
          sig.signatureDataUrl || '',
          sig.createdAt,
          sig.verified
        ]
      );
      return { success: true };
    } catch (err: any) {
      console.error('[PostgreSQL] Error adding signature:', err);
      if (err?.code === '23505') { // Duplicate key in Postgres
        return {
          success: false,
          error: 'මෙම ජาතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සன் කර ඇත / This NIC has already signed this petition.'
        };
      }
      return { success: false, error: err.message || 'Database error occurred' };
    }
  } else {
    try {
      const signatures = await getAllNewSignatures();
      const checkDup = signatures.find(s => s.nic.toUpperCase() === trimmedNic);
      if (checkDup) {
        return {
          success: false,
          error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සன் කර ඇත / This NIC has already signed this petition.'
        };
      }

      signatures.unshift(sig); // Insert at the beginning (descending order)
      fs.writeFileSync(LOCAL_JSON_DB_PATH, JSON.stringify(signatures, null, 2), 'utf-8');
      return { success: true };
    } catch (err: any) {
      console.error('[LocalDB] Error adding signature:', err);
      return { success: false, error: err.message || 'Local storage write error' };
    }
  }
}
