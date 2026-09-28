import fs from 'fs';
import path from 'path';
import https from 'https';

// Define the Signature interface
export interface DBResponseSignature {
  id: string;
  fullName: string;
  nic: string;
  phone: string;
  district: string;
  comment?: string;
  signatureDataUrl?: string;
  createdAt: string;
  verified: boolean;
}

const LOCAL_JSON_DB_PATH = path.join(process.cwd(), 'local_signatures_db.json');
const BACKUP_JSON_PATH = path.join(process.cwd(), 'public', 'gnanasara_petition_backup.json');

// cPanel PHP API Bridge configuration
const PHP_BRIDGE_URL = 'https://oneplanet.lk/freedom/signatures-api.php';
const API_KEY = '5m_sig_petition_key_2026';

// Bunny Storage CDN configuration
const BUNNY_ENDPOINT = 'sg.storage.bunnycdn.com';
const BUNNY_PATH = '/gnanasara-petition/signatures.json';
const BUNNY_ACCESS_KEY = 'e09085cd-4065-4aa7-a543641e2577-a063-4a05';

// Helper to fetch from Bunny Storage
async function fetchFromBunnyStorage(): Promise<DBResponseSignature[]> {
  return new Promise((resolve) => {
    const options = {
      hostname: BUNNY_ENDPOINT,
      path: BUNNY_PATH,
      method: 'GET',
      headers: {
        'AccessKey': BUNNY_ACCESS_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`[BunnyDB] Successfully fetched ${parsed.length} signatures from Bunny Storage!`);
              resolve(parsed);
              return;
            }
          } catch (e) {
            console.error('[BunnyDB] Error parsing JSON from Bunny Storage:', e);
          }
        }
        resolve([]);
      });
    });

    req.on('error', (err) => {
      console.error('[BunnyDB] Fetch error:', err);
      resolve([]);
    });

    req.end();
  });
}

// Helper to save to Bunny Storage
async function saveToBunnyStorage(signatures: DBResponseSignature[]): Promise<boolean> {
  return new Promise((resolve) => {
    const body = JSON.stringify(signatures, null, 2);
    const options = {
      hostname: BUNNY_ENDPOINT,
      path: BUNNY_PATH,
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_ACCESS_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        console.log('[BunnyDB] Successfully saved signatures to Bunny Storage!');
        resolve(true);
      } else {
        console.error(`[BunnyDB] Save failed with status ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.error('[BunnyDB] Save error:', err);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

// Local backup loader in case Bunny is brand new/empty
function getLocalBackupSignatures(): DBResponseSignature[] {
  try {
    if (fs.existsSync(BACKUP_JSON_PATH)) {
      const content = fs.readFileSync(BACKUP_JSON_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed as DBResponseSignature[];
      }
    }
  } catch (err) {
    console.error('[LocalDB] Error reading backup JSON:', err);
  }
  return [];
}

// Local JSON fallback utilities
function getLocalSignaturesFallback(): DBResponseSignature[] {
  try {
    if (fs.existsSync(LOCAL_JSON_DB_PATH)) {
      const fileContent = fs.readFileSync(LOCAL_JSON_DB_PATH, 'utf-8');
      return JSON.parse(fileContent) as DBResponseSignature[];
    }
  } catch (err) {
    console.error('[LocalDB] Error reading local JSON database fallback:', err);
  }
  return [];
}

function saveLocalSignaturesFallback(signatures: DBResponseSignature[]) {
  try {
    fs.writeFileSync(LOCAL_JSON_DB_PATH, JSON.stringify(signatures, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LocalDB] Error writing local JSON database fallback:', err);
  }
}

// Dummy setup check to keep interface consistency
export async function ensureDatabaseSetup() {
  // Setup is handled by cPanel PHP script or Bunny Storage
}

// Fetch all signatures
export async function getAllNewSignatures(): Promise<DBResponseSignature[]> {
  // 1. Try fetching from cPanel PHP Bridge (Primary & best option)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5 seconds timeout

    const response = await fetch(PHP_BRIDGE_URL, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && Array.isArray(data.signatures)) {
        console.log('[PHP Bridge] Successfully fetched signatures from cPanel MySQL!');
        return data.signatures;
      }
    }
  } catch (err) {
    // PHP bridge is optional; fallback to Bunny CDN silently
  }

  // 2. Try fetching from Bunny Storage CDN (Free, no quota, unlimited scale)
  const bunnyList = await fetchFromBunnyStorage();
  if (bunnyList.length > 0) {
    return bunnyList;
  }

  // If Bunny Storage is empty/new, try to pre-populate it with our 100% complete Local Backup
  const localBackup = getLocalBackupSignatures();
  if (localBackup.length > 0) {
    console.log('[BunnyDB] Bunny Storage signatures.json is empty. Initializing with local backup signatures...');
    await saveToBunnyStorage(localBackup);
    return localBackup;
  }

  // 3. Absolute Fallback: Local JSON database
  return getLocalSignaturesFallback();
}

// Add a new signature
export async function addNewSignature(sig: DBResponseSignature): Promise<{ success: boolean; error?: string }> {
  const trimmedNic = sig.nic.trim().toUpperCase();

  // 1. Try saving to cPanel PHP Bridge (Primary)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    const response = await fetch(PHP_BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(sig),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (response.ok && data) {
      if (data.success) {
        console.log('[PHP Bridge] Successfully saved signature to cPanel MySQL!');
        return { success: true };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    }
  } catch (err) {
    // PHP bridge is optional; fallback to Bunny CDN silently
  }

  // 2. Try saving to Bunny Storage CDN (Free, unlimited scale)
  try {
    let signatures = await fetchFromBunnyStorage();
    if (signatures.length === 0) {
      // Initialize with backup if empty
      signatures = getLocalBackupSignatures();
    }

    // Check duplicate NIC
    const isDuplicate = signatures.some(s => s.nic.trim().toUpperCase() === trimmedNic);
    if (isDuplicate) {
      return {
        success: false,
        error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සන් කර ඇත / This NIC has already signed this petition.'
      };
    }

    // Save
    signatures.unshift(sig);
    const saveSuccess = await saveToBunnyStorage(signatures);
    if (saveSuccess) {
      return { success: true };
    }
  } catch (bunnyErr: any) {
    console.error('[BunnyDB] Failed to save to Bunny Storage. Falling back to Local JSON:', bunnyErr);
  }

  // 3. Absolute Fallback: Local JSON database
  try {
    const signatures = getLocalSignaturesFallback();
    const checkDup = signatures.find(s => s.nic.toUpperCase() === trimmedNic);
    if (checkDup) {
      return {
        success: false,
        error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සන් කර ඇත / This NIC has already signed this petition.'
      };
    }

    signatures.unshift(sig);
    saveLocalSignaturesFallback(signatures);
    return { success: true };
  } catch (localErr: any) {
    return { success: false, error: localErr.message || 'Local storage write error' };
  }
}

// Fetch single signature by ID or NIC
export async function getSignatureByIdOrNic(queryVal: string): Promise<DBResponseSignature | null> {
  const trimmed = queryVal.trim().toUpperCase();

  // 1. Try PHP Bridge
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${PHP_BRIDGE_URL}?query=${encodeURIComponent(trimmed)}`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && Array.isArray(data.signatures)) {
        const found = data.signatures.find((s: any) => s.id.toUpperCase() === trimmed || s.nic.toUpperCase() === trimmed);
        if (found) return found;
      }
    }
  } catch (err) {
    // PHP bridge is optional; fallback silently
  }

  // 2. Query Bunny Storage
  try {
    const list = await fetchFromBunnyStorage();
    const found = list.find(s => s.id.toUpperCase() === trimmed || s.nic.toUpperCase() === trimmed);
    if (found) return found;
  } catch (bunnyErr) {
    console.error('[BunnyDB] Failed to query Bunny Storage:', bunnyErr);
  }

  // 3. Fallback: Local JSON
  const list = getLocalSignaturesFallback();
  const found = list.find(s => s.id.toUpperCase() === trimmed || s.nic.toUpperCase() === trimmed);
  return found || null;
}
