import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllNewSignatures } from '../api-lib/db.js';

function maskNicServer(nic: string): string {
  if (!nic) return '';
  const clean = nic.trim().toUpperCase();
  if (clean.length <= 4) return '****';
  const start = clean.slice(0, 2);
  const end = clean.slice(-3);
  return `${start}*****${end}`;
}

function maskPhoneServer(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 7) return '07********';
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

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
    const safeList = list.map(s => ({
      id: s.id,
      fullName: s.fullName,
      nic: maskNicServer(s.nic),
      district: s.district,
      comment: s.comment,
      createdAt: s.createdAt,
      verified: s.verified
    }));
    res.status(200).json({ success: true, signatures: safeList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch signatures' });
  }
}
