import { Signature, PetitionStats } from '../types';
import { db, testFirestoreConnection } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
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
export const INITIAL_BASE_COUNT = 0;

// In-memory cache synced with Firestore
let inMemorySignatures: Signature[] = [];

// Initialize memory cache from localStorage on load
try {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed)) {
      inMemorySignatures = parsed;
    }
  }
} catch (e) {
  console.warn('[PetitionStore] Could not read local storage cache', e);
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

  const districtStats: Record<string, number> = {};
  signatures.forEach(sig => {
    districtStats[sig.district] = (districtStats[sig.district] || 0) + 1;
  });

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
 * Real-time subscription to Firebase Firestore signatures collection.
 * Any new signature added across any phone/browser instantly updates here.
 */
export function subscribeToSignatures(callback: (signatures: Signature[]) => void): Unsubscribe {
  // Test connection once
  testFirestoreConnection().catch(() => {});

  try {
    const colRef = collection(db, 'signatures');
    // Order by createdAt descending to show latest first
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
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

        // Update in-memory and persistent local cache
        saveStoredSignatures(list);
        callback(list);
      },
      (error) => {
        console.warn('[Firebase] Firestore onSnapshot warning:', error.message);
        // Fall back to stored signatures if offline
        callback(inMemorySignatures);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[Firebase] Error setting up listener:', err);
    callback(inMemorySignatures);
    return () => {};
  }
}

/**
 * Adds a new signature directly to Firebase Firestore, and updates local cache.
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

  try {
    // Save to Firestore cloud database
    const docRef = doc(db, 'signatures', newSignature.id);
    await setDoc(docRef, newSignature);

    // Synchronously update local cache so UI is instantaneous
    const updated = [newSignature, ...currentSignatures.filter(s => s.id !== newSignature.id)];
    saveStoredSignatures(updated);

    return {
      success: true,
      signature: newSignature
    };
  } catch (err: any) {
    console.warn('[Firebase] Firestore write error, saving locally:', err);
    // If offline or network issue, persist locally as resilience
    const updated = [newSignature, ...currentSignatures];
    saveStoredSignatures(updated);

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
