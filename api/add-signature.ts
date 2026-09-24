import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addNewSignature } from '../api-lib/db.js';

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

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const { fullName, nic, phone, district, comment, signatureDataUrl } = req.body;

    if (!fullName || !nic || !phone || !district) {
      res.status(400).json({ success: false, error: 'Missing required signature fields' });
      return;
    }

    const newSig = {
      id: 'sig_' + Math.random().toString(36).substr(2, 9),
      fullName: fullName.trim(),
      nic: nic.trim().toUpperCase(),
      phone: phone.trim(),
      district: district.trim(),
      comment: comment?.trim() || '',
      signatureDataUrl: signatureDataUrl || '',
      createdAt: new Date().toISOString(),
      verified: true
    };

    const dbResult = await addNewSignature(newSig);
    if (!dbResult.success) {
      res.status(400).json({ success: false, error: dbResult.error });
      return;
    }

    res.status(200).json({ success: true, signature: newSig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to submit signature' });
  }
}
