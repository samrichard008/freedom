import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { getAllNewSignatures } from '../api-lib/db.js';

// Helper to escape CSV values correctly
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Replace double quotes with two double quotes and wrap in double quotes if it contains commas, quotes, or newlines
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { secret, format } = req.query;

  // Security Gate
  if (secret !== 'sam_admin_2026') {
    res.status(403).json({ 
      success: false, 
      error: 'Unauthorized access. Please provide the correct admin secret key to download raw signatures.' 
    });
    return;
  }

  try {
    const mergedMap = new Map<string, any>();

    // 1. Fetch from Neon PostgreSQL (Primary source for 72k+ signatures on Vercel)
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (connectionString) {
      console.log('[Export Postgres] PostgreSQL connection string found. Querying...');
      const pool = new pg.Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        const resPg = await pool.query('SELECT * FROM signatures');
        console.log(`[Export Postgres] Fetched ${resPg.rows.length} signatures from Neon Postgres.`);
        
        for (const row of resPg.rows) {
          const key = (row.nic || '').trim().toUpperCase();
          if (key) {
            mergedMap.set(key, {
              id: row.id,
              fullName: row.full_name || row.fullName || '',
              nic: row.nic || '',
              phone: row.phone || '',
              district: row.district || '',
              comment: row.comment || '',
              createdAt: row.created_at || row.createdAt || new Date().toISOString(),
              verified: row.verified !== false
            });
          }
        }
      } catch (pgErr: any) {
        console.error('[Export Postgres] Failed to query PostgreSQL:', pgErr.message);
      } finally {
        await pool.end();
      }
    }

    // 2. Fetch from cPanel PHP Bridge & Bunny CDN (Source for newer signatures)
    try {
      const fallbackList = await getAllNewSignatures();
      console.log(`[Export Fallback] Fetched ${fallbackList.length} signatures from PHP Bridge / CDN.`);
      
      for (const sig of fallbackList) {
        const key = (sig.nic || '').trim().toUpperCase();
        if (key) {
          // Add or overwrite with newer cPanel signature details if exists
          mergedMap.set(key, {
            id: sig.id,
            fullName: sig.fullName || '',
            nic: sig.nic || '',
            phone: sig.phone || '',
            district: sig.district || '',
            comment: sig.comment || '',
            createdAt: sig.createdAt || new Date().toISOString(),
            verified: sig.verified !== false
          });
        }
      }
    } catch (fbErr: any) {
      console.error('[Export Fallback] Failed to query fallback sources:', fbErr.message);
    }

    // 3. Convert Map to Array
    const finalCombinedList = Array.from(mergedMap.values());

    // Sort by createdAt descending (newest first)
    finalCombinedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (format === 'csv') {
      // Return beautiful, Excel-compatible CSV file with UTF-8 BOM
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="freedom_signatures_complete_backup.csv"');
      
      // UTF-8 BOM to make sure Excel displays Sinhala/Tamil characters correctly
      const BOM = '\uFEFF';
      const csvHeaders = ['ID', 'Full Name', 'NIC', 'Phone Number', 'District', 'Date & Time', 'Verified', 'Comment'];
      
      const csvRows = finalCombinedList.map(s => [
        escapeCsvValue(s.id),
        escapeCsvValue(s.fullName),
        escapeCsvValue(s.nic),
        escapeCsvValue(s.phone),
        escapeCsvValue(s.district),
        escapeCsvValue(s.createdAt),
        escapeCsvValue(s.verified ? 'YES' : 'NO'),
        escapeCsvValue(s.comment || '')
      ]);

      const csvContent = BOM + [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\r\n');
      res.status(200).send(csvContent);
      return;
    }

    // Default: Return complete raw JSON list
    res.status(200).json({ 
      success: true, 
      count: finalCombinedList.length, 
      signatures: finalCombinedList 
    });

  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate export backup' 
    });
  }
}
