import React, { useState } from 'react';
import { Language, Signature } from '../types';
import { TRANSLATIONS, DISTRICTS } from '../data/translations';
import { verifySignatureQuery, maskNic } from '../data/petitionStore';
import { Search, X, CheckCircle, AlertTriangle, ShieldCheck, MapPin, Calendar } from 'lucide-react';

interface VerifyModalProps {
  language: Language;
  onClose: () => void;
  onSelectSignature: (sig: Signature) => void;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  language,
  onClose,
  onSelectSignature
}) => {
  const t = TRANSLATIONS[language];
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<Signature | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const found = verifySignatureQuery(query);
    setResult(found);
    setSearched(true);
  };

  const getDistrictName = (code: string) => {
    const found = DISTRICTS.find(d => d.value === code);
    return found ? (language === 'si' ? found.si : language === 'ta' ? found.ta : found.en) : code;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 space-y-5 sm:space-y-6 my-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>සත්‍යාපන පද්ධතිය</span>
          </div>
          <h3 className="text-xl font-bold text-stone-100 font-sinhala-display">
            {t.searchHeading}
          </h3>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 uppercase tracking-wider text-sm"
            />
            <Search className="w-5 h-5 text-stone-500 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{t.searchBtn}</span>
          </button>
        </form>

        {/* Results */}
        {searched && (
          <div className="pt-2">
            {result ? (
              <div className="p-5 rounded-2xl bg-stone-950 border border-emerald-500/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>{t.foundVerified}</span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-500">නම:</span>
                    <span className="font-semibold text-stone-100">{result.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">හැඳුනුම්පත් අංකය:</span>
                    <span className="font-mono text-amber-400">{maskNic(result.nic)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">පෙත්සම් අංකය:</span>
                    <span className="font-mono text-amber-400">{result.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">දිස්ත්‍රික්කය:</span>
                    <span>{getDistrictName(result.district)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">දිනය:</span>
                    <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectSignature(result);
                    onClose();
                  }}
                  className="w-full mt-2 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold transition"
                >
                  සහතිකය නරඹන්න (View Certificate)
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-stone-950 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{t.notFound}</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
