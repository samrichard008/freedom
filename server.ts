import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllNewSignatures, addNewSignature, ensureDatabaseSetup } from './api-lib/db.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize the database schema
ensureDatabaseSetup()
  .then(() => console.log('[Server] Database setup initialized successfully.'))
  .catch((err) => console.error('[Server] Database setup failed:', err));

// --- API Endpoints ---

// Get all signatures
app.get('/api/signatures', async (req, res) => {
  try {
    const list = await getAllNewSignatures();
    res.json({ success: true, signatures: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch signatures' });
  }
});

// Add a new signature
app.post('/api/add-signature', async (req, res) => {
  try {
    const { fullName, nic, phone, district, comment, signatureDataUrl } = req.body;

    if (!fullName || !nic || !phone || !district) {
      return res.status(400).json({ success: false, error: 'Missing required signature fields' });
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
      return res.status(400).json({ success: false, error: dbResult.error });
    }

    res.json({ success: true, signature: newSig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to submit signature' });
  }
});

// --- Vite Middleware or Static Asset Serving ---
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

if (!isProduction) {
  console.log('[Server] Running in DEVELOPMENT mode. Initializing Vite middleware...');
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  console.log('[Server] Running in PRODUCTION mode. Serving static production build...');
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Full-Stack server running at http://localhost:${PORT}`);
});
