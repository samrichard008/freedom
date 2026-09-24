import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit as limitQuery, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import pg from 'pg';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Serve CORS and OPTION requests
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

  const batchLimit = parseInt(req.query.limit as string || '500', 10);
  const startAfterId = req.query.startAfterId as string || null;

  try {
    // 1. Initialize Firebase
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestoreDb = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);

    // 2. Initialize pg Connection Pool
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      return res.status(500).json({ success: false, error: 'PostgreSQL connection string is missing in environment (DATABASE_URL).' });
    }
    const pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    // 3. Prepare Firestore query
    let firestoreQuery = query(
      collection(firestoreDb, 'signatures'),
      orderBy('createdAt', 'asc'),
      limitQuery(batchLimit)
    );

    if (startAfterId) {
      const docRef = doc(firestoreDb, 'signatures', startAfterId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        firestoreQuery = query(
          collection(firestoreDb, 'signatures'),
          orderBy('createdAt', 'asc'),
          startAfter(docSnap),
          limitQuery(batchLimit)
        );
      }
    }

    // 4. Fetch signatures from Firestore
    const querySnapshot = await getDocs(firestoreQuery);
    const signaturesToMigrate: any[] = [];
    let lastId: string | null = null;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      signaturesToMigrate.push({
        id: docSnap.id,
        fullName: data.fullName || '',
        nic: (data.nic || '').trim().toUpperCase(),
        phone: data.phone || '',
        district: data.district || '',
        comment: data.comment || '',
        signatureDataUrl: data.signatureDataUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        verified: data.verified !== false
      });
      lastId = docSnap.id;
    });

    if (signaturesToMigrate.length === 0) {
      await pool.end();
      return res.status(200).json({
        success: true,
        count: 0,
        lastId: null,
        message: 'No signatures left to migrate.'
      });
    }

    // 5. Connect to PG and insert signatures in a safe batch (ON CONFLICT DO NOTHING)
    const client = await pool.connect();
    let migratedCount = 0;
    try {
      // First ensure the table exists
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

      // Write each signature
      for (const sig of signaturesToMigrate) {
        if (!sig.nic) continue;
        try {
          const insertResult = await client.query(
            `INSERT INTO signatures (id, full_name, nic, phone, district, comment, signature_data_url, created_at, verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (nic) DO NOTHING`,
            [
              sig.id,
              sig.fullName,
              sig.nic,
              sig.phone,
              sig.district,
              sig.comment || '',
              sig.signatureDataUrl || '',
              sig.createdAt,
              sig.verified
            ]
          );
          if (insertResult.rowCount && insertResult.rowCount > 0) {
            migratedCount++;
          }
        } catch (singleInsertErr) {
          console.warn('[Migration] Failed to insert row:', sig.id, singleInsertErr);
        }
      }
    } finally {
      client.release();
      await pool.end();
    }

    res.status(200).json({
      success: true,
      count: signaturesToMigrate.length,
      migratedCount,
      lastId,
      message: `Fetched ${signaturesToMigrate.length} and newly migrated ${migratedCount} signatures successfully.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Migration error' });
  }
}
