import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, disableNetwork, enableNetwork } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to Firestore using the specific provisioned database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

let quotaExhausted = false;

export function isQuotaExhausted(): boolean {
  return quotaExhausted;
}

export function handleQuotaExhausted() {
  if (quotaExhausted) return;
  quotaExhausted = true;
  console.warn('[Firebase] Quota limit reached on free tier. Switching to robust offline cache mode.');
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
}

export function resumeNetworkIfPossible() {
  quotaExhausted = false;
  try {
    enableNetwork(db).catch(() => {});
  } catch {}
}

// Connection test as required by Firebase integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  if (quotaExhausted) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection validated successfully.');
    return true;
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || (typeof error?.message === 'string' && error.message.includes('Quota limit exceeded'))) {
      handleQuotaExhausted();
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or unreachable, please check config.');
    } else {
      console.log('[Firebase] Connection ready.');
    }
    return false;
  }
}
