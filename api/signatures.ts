import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllNewSignatures } from '../api-lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const list = await getAllNewSignatures();
    res.status(200).json({ success: true, signatures: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch signatures' });
  }
}
