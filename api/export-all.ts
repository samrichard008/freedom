import type { VercelRequest, VercelResponse } from '@vercel/node';
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
    const list = await getAllNewSignatures();

    // Sort by createdAt descending (newest first)
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (format === 'csv') {
      // Return beautiful, Excel-compatible CSV file with UTF-8 BOM
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="freedom_signatures_complete_backup.csv"');
      
      // UTF-8 BOM to make sure Excel displays Sinhala/Tamil characters correctly
      const BOM = '\uFEFF';
      const csvHeaders = ['ID', 'Full Name', 'NIC', 'Phone Number', 'District', 'Date & Time', 'Verified', 'Comment'];
      
      const csvRows = list.map(s => [
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
      count: list.length, 
      signatures: list 
    });

  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to generate export backup' 
    });
  }
}
