import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSignatureByIdOrNic } from '../api-lib/db.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const queryVal = (req.query.query as string || '').trim().toUpperCase();
  if (!queryVal) {
    return res.status(400).json({ success: false, error: 'Query parameter is missing' });
  }

  try {
    const sig = await getSignatureByIdOrNic(queryVal);

    if (!sig) {
      return res.status(200).json({ success: true, found: false });
    }

    const safeSig = {
      ...sig,
      nic: maskNicServer(sig.nic),
      phone: maskPhoneServer(sig.phone)
    };

    res.status(200).json({ success: true, found: true, signature: safeSig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Database error occurred' });
  }
}
