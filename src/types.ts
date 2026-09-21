export interface Signature {
  id: string;
  fullName: string;
  nic: string; // Stored securely; masked for public display (e.g. 91****123V)
  phone: string;
  district: string;
  comment?: string;
  signatureDataUrl?: string; // Base64 canvas stroke or typed signature
  createdAt: string;
  verified: boolean;
}

export interface PetitionStats {
  target: number;
  currentCount: number;
  percentage: number;
  recentSignatures: Array<Omit<Signature, 'phone'> & { maskedNic: string }>;
  districtStats: Record<string, number>;
}

export type Language = 'si' | 'en' | 'ta';

export interface DistrictOption {
  value: string;
  si: string;
  en: string;
  ta: string;
}
