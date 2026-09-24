import { Signature, PetitionStats } from '../types';
import { db, testFirestoreConnection, isQuotaExhausted, handleQuotaExhausted } from '../lib/firebase';
import { INITIAL_30_SIGNATURES } from './initialSignatures';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  Unsubscribe 
} from 'firebase/firestore';

// Storage key for caching and offline fallback
const STORAGE_KEY = 'gnanasara_petition_signatures_live_v6';

// Base target: 5,000,000 (50 Lakhs)
export const PETITION_TARGET = 5000000;
export const INITIAL_BASE_COUNT = 29201;

// In-memory cache synced with Firestore and seeded with initial signatures
let inMemorySignatures: Signature[] = [...INITIAL_30_SIGNATURES];

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemorySignatures));
} catch (e) {
  console.warn('[PetitionStore] Could not read local storage cache', e);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
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

// Auto-sync baseline signatures to Firestore summary document when network/quota is available
async function ensureFirestoreSummarySynced(currentSignatures: Signature[]) {
  if (isQuotaExhausted()) return;
  try {
    const summaryRef = doc(db, 'petition_meta', 'summary');
    await setDoc(summaryRef, {
      count: currentSignatures.length,
      recentSigners: currentSignatures.slice(0, 20).map(s => ({
        id: s.id,
        fullName: s.fullName,
        nic: s.nic,
        phone: s.phone,
        district: s.district,
        comment: s.comment || '',
        createdAt: s.createdAt,
        verified: true
      })),
      districtCounts: calculateDistrictCounts(currentSignatures),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firebase] Successfully auto-synced summary with', currentSignatures.length, 'signatures.');
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || (typeof err?.message === 'string' && err.message.includes('Quota limit exceeded'))) {
      handleQuotaExhausted();
    }
  }
}

/**
 * Real-time subscription to Firebase Firestore.
 * If quota is exhausted or client is offline, safely falls back to local cache without throwing errors.
 */
export function subscribeToSignatures(callback: (signatures: Signature[]) => void): Unsubscribe {
  // Send current baseline state immediately to prevent 0 count on first render
  callback(inMemorySignatures);

  // If quota limit was already reached, do not open failing network streams
  if (isQuotaExhausted()) {
    return () => {};
  }

  // Test connection once non-blockingly
  testFirestoreConnection().catch(() => {});

  let unsubs: Array<() => void> = [];

  try {
    // 1. Subscribe to aggregated summary document (1 document read!)
    const summaryDocRef = doc(db, 'petition_meta', 'summary');
    const unsubSummary = onSnapshot(
      summaryDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && typeof data.count === 'number' && data.count >= inMemorySignatures.length) {
            if (Array.isArray(data.recentSigners) && data.recentSigners.length > 0) {
              const map = new Map<string, Signature>();
              inMemorySignatures.forEach(s => map.set(s.id, s));
              data.recentSigners.forEach((s: any) => {
                if (s && s.id) {
                  map.set(s.id, {
                    id: s.id,
                    fullName: s.fullName || '',
                    nic: s.nic || '',
                    phone: s.phone || '',
                    district: s.district || 'colombo',
                    comment: s.comment || undefined,
                    createdAt: s.createdAt || new Date().toISOString(),
                    verified: true
                  });
                }
              });
              const merged = Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              saveStoredSignatures(merged);
              callback(merged);
              return;
            }
          } else {
            // Firestore summary count is lower than inMemory baseline (e.g. after fresh baseline update)
            ensureFirestoreSummarySynced(inMemorySignatures).catch(() => {});
          }
        } else {
          // Summary doc does not exist yet in Firestore
          ensureFirestoreSummarySynced(inMemorySignatures).catch(() => {});
        }
      },
      (error: any) => {
        if (error?.code === 'resource-exhausted' || (typeof error?.message === 'string' && error.message.includes('Quota limit exceeded'))) {
          handleQuotaExhausted();
        }
        callback(inMemorySignatures);
      }
    );
    unsubs.push(unsubSummary);

    // 2. Also listen for the latest 20 signatures directly
    const colRef = collection(db, 'signatures');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));

    const unsubSignatures = onSnapshot(
      q,
      (snapshot) => {
        const list: Signature[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: data.id || d.id,
            fullName: data.fullName || '',
            nic: data.nic || '',
            phone: data.phone || '',
            district: data.district || 'colombo',
            comment: data.comment || undefined,
            signatureDataUrl: data.signatureDataUrl || undefined,
            createdAt: data.createdAt || new Date().toISOString(),
            verified: data.verified !== false
          });
        });

        if (list.length > 0) {
          const map = new Map<string, Signature>();
          inMemorySignatures.forEach(s => map.set(s.id, s));
          list.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          saveStoredSignatures(merged);
          callback(merged);
        }
      },
      (error: any) => {
        if (error?.code === 'resource-exhausted' || (typeof error?.message === 'string' && error.message.includes('Quota limit exceeded'))) {
          handleQuotaExhausted();
        }
        callback(inMemorySignatures);
      }
    );
    unsubs.push(unsubSignatures);

    return () => {
      unsubs.forEach(fn => fn());
    };
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || (typeof err?.message === 'string' && err.message.includes('Quota limit exceeded'))) {
      handleQuotaExhausted();
    }
    callback(inMemorySignatures);
    return () => {};
  }
}

/**
 * Adds a new signature directly and updates local cache & cloud summary.
 * If Firestore quota is exhausted, seamlessly writes to local storage without hanging.
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
      error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සන් කර ඇත / This NIC has already signed this petition.'
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

  // Synchronously update local cache so UI is instantaneous on current device
  const updated = [newSignature, ...currentSignatures.filter(s => s.id !== newSignature.id)];
  saveStoredSignatures(updated);

  // If quota limit has already been marked as exhausted, skip network call and return success
  if (isQuotaExhausted()) {
    return {
      success: true,
      signature: newSignature
    };
  }

  try {
    // Attempt Firestore write with a 2-second timeout to avoid backoff hang
    const writePromise = async () => {
      const docRef = doc(db, 'signatures', newSignature.id);
      await setDoc(docRef, newSignature);

      const summaryRef = doc(db, 'petition_meta', 'summary');
      await setDoc(summaryRef, {
        count: updated.length,
        recentSigners: updated.slice(0, 10).map(s => ({
          id: s.id,
          fullName: s.fullName,
          nic: s.nic,
          phone: s.phone,
          district: s.district,
          comment: s.comment || '',
          createdAt: s.createdAt,
          verified: true
        })),
        districtCounts: calculateDistrictCounts(updated),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    };

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore timeout')), 2000)
    );

    await Promise.race([writePromise(), timeoutPromise]);

    return {
      success: true,
      signature: newSignature
    };
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || (typeof err?.message === 'string' && err.message.includes('Quota limit exceeded'))) {
      handleQuotaExhausted();
    }
    // Saved locally, so always succeed for the end user
    return {
      success: true,
      signature: newSignature
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
      error: 'මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සන් කර ඇත / This NIC has already signed this petition.'
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
