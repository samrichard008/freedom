import { Signature, PetitionStats } from '../types';
import { db, testFirestoreConnection } from '../lib/firebase';
import { INITIAL_30_SIGNATURES } from './initialSignatures';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  Unsubscribe 
} from 'firebase/firestore';

// Storage key for caching and offline fallback
const STORAGE_KEY = 'gnanasara_petition_signatures_live_v2';

// Base target: 5,000,000 (50 Lakhs)
export const PETITION_TARGET = 5000000;
export const INITIAL_BASE_COUNT = 30;

// In-memory cache synced with Firestore and seeded with initial 30 signatures
let inMemorySignatures: Signature[] = [...INITIAL_30_SIGNATURES];

// Initialize memory cache from localStorage on load
try {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge cached with initial signatures by ID
      const map = new Map<string, Signature>();
      INITIAL_30_SIGNATURES.forEach(s => map.set(s.id, s));
      parsed.forEach((s: Signature) => map.set(s.id, s));
      inMemorySignatures = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } else {
    // Save initial 30 signatures to localStorage so this browser is seeded
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_30_SIGNATURES));
  }
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

// Background sync to ensure initial / cached signatures are pushed to Firestore summary
async function syncLocalToFirestoreSummary(signatures: Signature[]) {
  try {
    const summaryRef = doc(db, 'petition_meta', 'summary');
    await setDoc(summaryRef, {
      count: signatures.length,
      recentSigners: signatures.slice(0, 10).map(s => ({
        id: s.id,
        fullName: s.fullName,
        nic: s.nic,
        phone: s.phone,
        district: s.district,
        comment: s.comment || '',
        createdAt: s.createdAt,
        verified: true
      })),
      districtCounts: calculateDistrictCounts(signatures),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firebase] Synchronized summary with', signatures.length, 'signatures');
  } catch (err) {
    // If quota or network issue, non-blocking
    console.warn('[Firebase] Summary sync notice:', err);
  }
}

// Trigger initial sync on startup
setTimeout(() => {
  syncLocalToFirestoreSummary(inMemorySignatures).catch(() => {});
}, 1000);

/**
 * Real-time subscription to Firebase Firestore.
 * Uses lightweight summary document to preserve read quota and serve high traffic.
 */
export function subscribeToSignatures(callback: (signatures: Signature[]) => void): Unsubscribe {
  // Test connection once
  testFirestoreConnection().catch(() => {});

  // Send current baseline state immediately to prevent 0 count on first render
  callback(inMemorySignatures);

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
              // Merge recent signers with in-memory list
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
          }
        }
      },
      (error) => {
        console.warn('[Firebase] Summary snapshot notice (quota/offline):', error.message);
        callback(inMemorySignatures);
      }
    );
    unsubs.push(unsubSummary);

    // 2. Also listen for the latest 20 signatures directly (only 20 reads, not entire db)
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
          // Merge with in-memory
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
      (error) => {
        console.warn('[Firebase] Signatures query notice (quota/offline):', error.message);
        callback(inMemorySignatures);
      }
    );
    unsubs.push(unsubSignatures);

    return () => {
      unsubs.forEach(fn => fn());
    };
  } catch (err) {
    console.error('[Firebase] Error setting up listener:', err);
    callback(inMemorySignatures);
    return () => {};
  }
}

/**
 * Adds a new signature directly to Firebase Firestore, and updates local cache & cloud summary.
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

  try {
    // 1. Save to individual Firestore document
    const docRef = doc(db, 'signatures', newSignature.id);
    await setDoc(docRef, newSignature);

    // 2. Also update aggregated cloud summary so all other browsers/phones immediately get the new count & signer
    const summaryRef = doc(db, 'petition_meta', 'summary');
    setDoc(summaryRef, {
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
    }, { merge: true }).catch((e) => console.warn('[Firebase] Summary sync background notice:', e));

    return {
      success: true,
      signature: newSignature
    };
  } catch (err: any) {
    console.warn('[Firebase] Firestore write notice, stored locally:', err);
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
  // Trigger async background Firestore write
  addSignatureAsync(data).catch(console.error);

  const trimmedNic = data.nic.trim().toUpperCase();
  const currentSignatures = getStoredSignatures();
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

export function exportSignaturesToCsv(): void {
  const signatures = getStoredSignatures();
  if (signatures.length === 0) return;

  const headers = ['ID', 'Full Name', 'NIC', 'Phone', 'District', 'Date', 'Comment'];
  const rows = signatures.map(s => [
    `"${s.id}"`,
    `"${s.fullName.replace(/"/g, '""')}"`,
    `"${maskNic(s.nic)}"`,
    `"${s.phone}"`,
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
