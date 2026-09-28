import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit as limitQuery, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import mysql from 'mysql2/promise';
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

    // 2. Prepare Firestore query
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

    // 3. Fetch signatures from Firestore
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
      return res.status(200).json({
        success: true,
        count: 0,
        lastId: null,
        message: 'No signatures left to migrate.'
      });
    }

    // 4. Connect to MySQL and insert signatures in a safe batch
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
      // First ensure the table exists
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

      // Write each signature
      for (const sig of signaturesToMigrate) {
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
              sig.phone,
              sig.district,
              sig.comment || '',
              sig.signatureDataUrl || '',
              sig.createdAt,
              sig.verified ? 1 : 0
            ]
          );
          migratedCount++;
        } catch (singleInsertErr) {
          console.warn('[Migration] Failed to insert row:', sig.id, singleInsertErr);
        }
      }
    } finally {
      await connection.end();
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
