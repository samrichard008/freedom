import { Signature, PetitionStats } from '../types';

const STORAGE_KEY = 'gnanasara_petition_signatures_v1';
const STATS_KEY = 'gnanasara_petition_stats_v1';

// Base target: 5,000,000 (50 Lakhs)
export const PETITION_TARGET = 5000000;
// Baseline counter starting around 1,482,790 to demonstrate realistic national scale
export const INITIAL_BASE_COUNT = 1482790;

const INITIAL_RECENT_SIGNATURES: Signature[] = [
  {
    id: 'SL-PET-84912',
    fullName: 'සුනිල් ශාන්ත බණ්ඩාර',
    nic: '197824109823',
    phone: '077****214',
    district: 'kandy',
    comment: 'උන්වහන්සේට කඩිනමින් ජනාධිපති සමාව හිමිවේවා! ජාතිය වෙනුවෙන් කළ මෙහෙවර අමතක කළ නොහැක.',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    verified: true
  },
  {
    id: 'SL-PET-84911',
    fullName: 'එම්. මොහොමඩ් රිස්වාන්',
    nic: '198912304918',
    phone: '071****891',
    district: 'colombo',
    comment: 'අපි සියලුම ශ්‍රී ලාංකිකයින් සහෝදරත්වයෙන් එකට ජීවත් විය යුතුයි. සාධාරණත්වය ඉටු වේවා.',
    createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    verified: true
  },
  {
    id: 'SL-PET-84910',
    fullName: 'චාමින්ද කුමාර දිසානායක',
    nic: '198421098711',
    phone: '076****532',
    district: 'kurunegala',
    comment: 'ජනාධිපතිතුමනි, වහාම නිදහස දෙන්න. අපේ රටේ සඟරුවන සුරැකිය යුතුය.',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    verified: true
  },
  {
    id: 'SL-PET-84909',
    fullName: 'එස්. කුමාරවේල්',
    nic: '199218765432',
    phone: '075****901',
    district: 'jaffna',
    comment: 'மனிதநேய அடிப்படையில் உடனடி விடுதலை வழங்கப்பட வேண்டும்.',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    verified: true
  },
  {
    id: 'SL-PET-84908',
    fullName: 'අනුලා දමයන්ති රත්නායක',
    nic: '196558291024',
    phone: '070****334',
    district: 'galle',
    comment: 'සිරගෙදර අපායෙන් උන්වහන්සේ මුදා ගන්න. ජාතිය වෙනුවෙන් අපේ යුතුකම ඉටු කරමු.',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    verified: true
  },
  {
    id: 'SL-PET-84907',
    fullName: 'රොහාන් ප්‍රියන්ත අබේසේකර (UK)',
    nic: '198129038411',
    phone: '+447****890',
    district: 'overseas',
    comment: 'විදේශගත ශ්‍රී ලාංකිකයින් ලෙස අප සියලු දෙනා මේ වෙනුවෙන් පෙනී සිටිමු.',
    createdAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    verified: true
  },
  {
    id: 'SL-PET-84906',
    fullName: 'ජගත් ජයසිංහ',
    nic: '197519284712',
    phone: '078****129',
    district: 'gampaha',
    comment: 'අත්සන් ලක්ෂ 50 ක ඉලක්කය ඉක්මනින් සම්පූර්ණ කරමු! ජනාධිපති තුමනි අවධානය යොමු කරන්න.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    verified: true
  },
  {
    id: 'SL-PET-84905',
    fullName: 'ධම්මික හේරත්',
    nic: '198831920412',
    phone: '072****445',
    district: 'matara',
    comment: 'දවසක සිංහලයන්ගේ වීරයා ඔබවහන්සේ ය. ඔබවහන්සේට ඉක්මන් නිදහස!',
    createdAt: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    verified: true
  }
];

export function getStoredSignatures(): Signature[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading signatures from localStorage', e);
  }
  return INITIAL_RECENT_SIGNATURES;
}

export function saveStoredSignatures(signatures: Signature[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
  } catch (e) {
    console.error('Error saving signatures to localStorage', e);
  }
}

export function getPetitionStats(): PetitionStats {
  const signatures = getStoredSignatures();
  const addedCount = Math.max(0, signatures.length - INITIAL_RECENT_SIGNATURES.length);
  const currentCount = INITIAL_BASE_COUNT + addedCount;
  const percentage = Math.min(100, Number(((currentCount / PETITION_TARGET) * 100).toFixed(2)));

  const districtStats: Record<string, number> = {};
  signatures.forEach(sig => {
    districtStats[sig.district] = (districtStats[sig.district] || 0) + 1;
  });

  const recentSignatures = signatures.slice(0, 15).map(sig => ({
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

export function addSignature(data: {
  fullName: string;
  nic: string;
  phone: string;
  district: string;
  comment?: string;
  signatureDataUrl?: string;
}): { success: boolean; signature: Signature; error?: string } {
  const trimmedNic = data.nic.trim().toUpperCase();
  const signatures = getStoredSignatures();

  // Check if NIC already signed
  const alreadySigned = signatures.find(s => s.nic.toUpperCase() === trimmedNic);
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
    comment: data.comment?.trim(),
    signatureDataUrl: data.signatureDataUrl,
    createdAt: new Date().toISOString(),
    verified: true
  };

  const updated = [newSignature, ...signatures];
  saveStoredSignatures(updated);

  return {
    success: true,
    signature: newSignature
  };
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
