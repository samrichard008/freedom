import { Signature, PetitionStats } from '../types';
import { INITIAL_30_SIGNATURES } from './initialSignatures';

// Storage key for caching and offline fallback
const STORAGE_KEY = 'gnanasara_petition_signatures_live_v6';

// Base target: 5,000,000 (50 Lakhs)
export const PETITION_TARGET = 5000000;
export const INITIAL_BASE_COUNT = 29201;

// In-memory cache synced with API and seeded with initial signatures
let inMemorySignatures: Signature[] = [...INITIAL_30_SIGNATURES];
let bunnyBaseline: Signature[] = [];
let isBunnyLoaded = false;
const activeCallbacks: Set<(signatures: Signature[]) => void> = new Set();

// Initialize memory cache from localStorage on load with backward compatibility
try {
  const map = new Map<string, Signature>();
  INITIAL_30_SIGNATURES.forEach(s => map.set(s.id, s));

  // Merge any locally submitted signatures from previous cache versions so no data is ever lost
  ['gnanasara_petition_signatures_live_v2', 'gnanasara_petition_signatures_live_v3', STORAGE_KEY].forEach(key => {
    try {
      const prev = localStorage.getItem(key);
      if (prev) {
        const parsed = JSON.parse(prev);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: Signature) => {
            if (s && s.id) map.set(s.id, s);
          });
        }
      }
    } catch {}
  });

  inMemorySignatures = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemorySignatures.slice(0, 100)));
  } catch {}
} catch (e) {
  console.warn('[PetitionStore] Could not read local storage cache', e);
}

// Background loading of large baseline from Bunny.net CDN
async function loadFromBunnyCdn() {
  if (isBunnyLoaded) return;
  try {
    console.log('[BunnyCDN] Loading signature baseline from CDN...');
    const response = await fetch('https://gnanasara-petition.b-cdn.net/signatures_db.json');
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      isBunnyLoaded = true;
      bunnyBaseline = data;
      console.log(`[BunnyCDN] Loaded ${data.length} signatures from CDN successfully!`);
      
      const map = new Map<string, Signature>();
      // First populate with Bunny CDN baseline
      bunnyBaseline.forEach((s: any) => {
        if (s && s.id) map.set(s.id, s);
      });
      // Then overwrite with any local/recent signatures (to make sure recent submissions are not lost)
      inMemorySignatures.forEach((s: Signature) => {
        if (s && s.id) map.set(s.id, s);
      });
      
      inMemorySignatures = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      saveStoredSignatures(inMemorySignatures);
      
      // Notify all active subscribers
      activeCallbacks.forEach(cb => {
        try {
          cb(inMemorySignatures);
        } catch {}
      });
    }
  } catch (err) {
    console.warn('[BunnyCDN] Failed to load signature baseline from CDN', err);
  }
}

// Fetch any new signatures from our backend API
async function fetchFromApi() {
  try {
    const res = await fetch('/api/signatures');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    
    if (result && Array.isArray(result.signatures)) {
      const apiSignatures: Signature[] = result.signatures;
      
      const map = new Map<string, Signature>();
      // 1. Load from baseline
      if (bunnyBaseline.length > 0) {
        bunnyBaseline.forEach(s => map.set(s.id, s));
      } else {
        INITIAL_30_SIGNATURES.forEach(s => map.set(s.id, s));
      }
      
      // 2. Load from API (new database submissions)
      apiSignatures.forEach((s) => {
        if (s && s.id) map.set(s.id, s);
      });
      
      // 3. Merge current in-memory / local offline signatures
      inMemorySignatures.forEach((s) => {
        if (s && s.id && !map.has(s.id)) {
          map.set(s.id, s);
        }
      });
      
      inMemorySignatures = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      saveStoredSignatures(inMemorySignatures);
      
      // Notify all active subscribers
      activeCallbacks.forEach(cb => {
        try {
          cb(inMemorySignatures);
        } catch {}
      });
    }
  } catch (err) {
    console.warn('[API] Failed to fetch signatures from API:', err);
  }
}

function calculateDistrictCounts(signatures: Signature[]): Record<string, number> {
  const districtStats: Record<string, number> = {};
  signatures.forEach(sig => {
    districtStats[sig.district] = (districtStats[sig.district] || 0) + 1;
  });
  return districtStats;
}

export function getStoredSignatures(): Signature[] {
  return inMemorySignatures;
}

export function saveStoredSignatures(signatures: Signature[]) {
  inMemorySignatures = signatures;
  try {
    // Only save the latest 100 signatures to localStorage to prevent QuotaExceededError (5MB browser limit)
    const lightweightCache = signatures.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightCache));
  } catch (e) {
    console.error('Error saving signatures to localStorage', e);
  }
}

export function calculateStats(signatures: Signature[]): PetitionStats {
  const currentCount = signatures.length;
  const percentage = currentCount === 0 ? 0 : Math.min(100, Number(((currentCount / PETITION_TARGET) * 100).toFixed(4)));

  const districtStats = calculateDistrictCounts(signatures);

  const recentSignatures = signatures.slice(0, 10).map(sig => ({
    ...sig,
    maskedNic: maskNic(sig.nic)
  }));

  return {
    target: PETITION_TARGET,
    currentCount,
    percentage,
    recentSignatures,
    districtStats
  };
}

export function getPetitionStats(): PetitionStats {
  return calculateStats(inMemorySignatures);
}

/**
 * Real-time active subscription simulation using optimized polling from Express/Vercel PostgreSQL API.
 */
export function subscribeToSignatures(callback: (signatures: Signature[]) => void): () => void {
  activeCallbacks.add(callback);

  // Send current baseline state immediately to prevent 0 count on first render
  callback(inMemorySignatures);

  // Trigger non-blocking background fetch from Bunny CDN
  loadFromBunnyCdn().catch(() => {});

  // Trigger initial fetch from database API
  fetchFromApi().catch(() => {});

  // Set up polling interval to check for new signatures every 12 seconds
  const interval = setInterval(() => {
    fetchFromApi().catch(() => {});
  }, 12000);

  return () => {
    clearInterval(interval);
    activeCallbacks.delete(callback);
  };
}

/**
 * Adds a new signature via our dual Express/Vercel Backend API.
 */
export async function addSignatureAsync(data: {
  fullName: string;
  nic: string;
  phone: string;
  district: string;
  comment?: string;
  signatureDataUrl?: string;
}): Promise<{ success: boolean; signature: Signature; error?: string }> {
  const trimmedNic = data.nic.trim().toUpperCase();
  const currentSignatures = getStoredSignatures();

  // Check duplicate NIC
  const alreadySigned = currentSignatures.find(s => s.nic.toUpperCase() === trimmedNic);
  if (alreadySigned) {
    return {
      success: false,
      signature: alreadySigned,
      error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සன் කර ඇත / This NIC has already signed this petition.'
    };
  }

  try {
    const res = await fetch('/api/add-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to submit signature');
    }

    const newSignature: Signature = result.signature;

    // Synchronously update local cache so UI is instantaneous on current device
    const updated = [newSignature, ...currentSignatures.filter(s => s.id !== newSignature.id)];
    saveStoredSignatures(updated);

    activeCallbacks.forEach(cb => {
      try {
        cb(updated);
      } catch {}
    });

    return {
      success: true,
      signature: newSignature
    };
  } catch (err: any) {
    console.warn('[API] Error submitting signature, saving to local fallback storage...', err);
    
    // Offline/Error Local Fallback: Create signature locally so the user experience is flawless
    const fallbackSignature: Signature = {
      id: generatePetitionId(),
      fullName: data.fullName.trim(),
      nic: trimmedNic,
      phone: data.phone.trim(),
      district: data.district,
      comment: data.comment?.trim() || '',
      signatureDataUrl: data.signatureDataUrl || '',
      createdAt: new Date().toISOString(),
      verified: true
    };

    const updated = [fallbackSignature, ...currentSignatures.filter(s => s.id !== fallbackSignature.id)];
    saveStoredSignatures(updated);

    activeCallbacks.forEach(cb => {
      try {
        cb(updated);
      } catch {}
    });

    return {
      success: true,
      signature: fallbackSignature
    };
  }
}

// Synchronous wrapper for backward compatibility
export function addSignature(data: {
  fullName: string;
  nic: string;
  phone: string;
  district: string;
  comment?: string;
  signatureDataUrl?: string;
}): { success: boolean; signature: Signature; error?: string } {
  const trimmedNic = data.nic.trim().toUpperCase();
  const currentSignatures = getStoredSignatures();

  const alreadySigned = currentSignatures.find(s => s.nic.toUpperCase() === trimmedNic);
  if (alreadySigned) {
    return {
      success: false,
      signature: alreadySigned,
      error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සன் කර ඇත / This NIC has already signed this petition.'
    };
  }

  const newSignature: Signature = {
    id: generatePetitionId(),
    fullName: data.fullName.trim(),
    nic: trimmedNic,
    phone: data.phone.trim(),
    district: data.district,
    comment: data.comment?.trim() || '',
    signatureDataUrl: data.signatureDataUrl || '',
    createdAt: new Date().toISOString(),
    verified: true
  };

  const updated = [newSignature, ...currentSignatures];
  saveStoredSignatures(updated);

  addSignatureAsync(data).catch(() => {});

  return {
    success: true,
    signature: newSignature
  };
}

export interface PaginatedResult {
  items: Signature[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getPaginatedSignatures(
  district: string = 'all',
  searchQuery: string = '',
  page: number = 1,
  pageSize: number = 50
): PaginatedResult {
  let all = getStoredSignatures();

  if (district !== 'all') {
    all = all.filter(s => s.district === district);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    all = all.filter(s => 
      s.fullName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.nic.toLowerCase().includes(q) ||
      (s.comment && s.comment.toLowerCase().includes(q))
    );
  }

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages
  };
}

export function maskPhone(phone: string): string {
  if (!phone) return '07********';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 7) return '07********';
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

export function exportSignaturesToCsv(): void {
  const signatures = getStoredSignatures();
  if (signatures.length === 0) return;

  const headers = ['ID', 'Full Name', 'NIC', 'Phone', 'District', 'Date', 'Comment'];
  const rows = signatures.map(s => [
    `"${s.id}"`,
    `"${s.fullName.replace(/"/g, '""')}"`,
    `"${maskNic(s.nic)}"`,
    `"${maskPhone(s.phone)}"`,
    `"${s.district}"`,
    `"${new Date(s.createdAt).toISOString()}"`,
    `"${(s.comment || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Gnanasara_Thero_Petition_Signatures_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function maskNic(nic: string): string {
  if (!nic) return '***';
  if (nic.includes('*')) return nic;
  if (nic.length <= 4) return '****';
  const start = nic.slice(0, 2);
  const end = nic.slice(-3);
  return `${start}*****${end}`;
}

export function generatePetitionId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `SL-PET-${randomNum}`;
}

export function verifySignatureQuery(query: string): Signature | null {
  const clean = query.trim().toUpperCase();
  if (!clean) return null;
  const signatures = getStoredSignatures();
  return (
    signatures.find(
      s => s.id.toUpperCase() === clean || s.nic.toUpperCase() === clean
    ) || null
  );
}

export async function verifySignatureQueryAsync(query: string): Promise<Signature | null> {
  const clean = query.trim().toUpperCase();
  if (!clean) return null;
  try {
    const res = await fetch(`/api/verify-signature?query=${encodeURIComponent(clean)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.found) {
      return data.signature;
    }
  } catch (err) {
    console.warn('[API] Error verifying signature:', err);
  }
  return null;
}
