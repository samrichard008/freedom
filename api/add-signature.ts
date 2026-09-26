import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import { addNewSignature } from '../api-lib/db.js';

const STORAGE_ZONE = 'gnanasara-petition';
const ACCESS_KEY = 'e09085cd-4065-4aa7-a543641e2577-a063-4a05';
const ENDPOINT = 'sg.storage.bunnycdn.com';

async function uploadSignatureToBunny(id: string, base64Data: string): Promise<string> {
  if (!base64Data || !base64Data.startsWith('data:image/')) {
    return base64Data;
  }
  try {
    const base64Body = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Body, 'base64');
    const remoteName = `signatures/sig_${id}.png`;

    await new Promise((resolve, reject) => {
      const options = {
        hostname: ENDPOINT,
        path: `/${STORAGE_ZONE}/${remoteName}`,
        method: 'PUT',
        headers: {
          'AccessKey': ACCESS_KEY,
          'Content-Type': 'image/png',
          'Content-Length': buffer.length
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`Status ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', err => reject(err));
      req.write(buffer);
      req.end();
    });

    return `https://gnanasara-petition.b-cdn.net/${remoteName}`;
  } catch (err) {
    console.error('[BunnyUpload] Failed to upload signature to Bunny Storage:', err);
    return base64Data;
  }
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

    const id = 'sig_' + Math.random().toString(36).substr(2, 9);
    
    // Upload base64 image to Bunny Storage CDN to save massive PostgreSQL database storage
    const savedSignatureUrl = await uploadSignatureToBunny(id, signatureDataUrl || '');

    const newSig = {
      id,
      fullName: fullName.trim(),
      nic: nic.trim().toUpperCase(),
      phone: phone.trim(),
      district: district.trim(),
      comment: comment?.trim() || '',
      signatureDataUrl: savedSignatureUrl,
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
