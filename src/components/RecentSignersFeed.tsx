import React, { useState } from 'react';
import { Language, Signature } from '../types';
import { TRANSLATIONS, DISTRICTS } from '../data/translations';
import { maskNic } from '../data/petitionStore';
import { Users, CheckCircle, MessageSquare, MapPin, Clock, Search } from 'lucide-react';

interface RecentSignersFeedProps {
  language: Language;
  signatures: Signature[];
  onOpenVerify: () => void;
}

export const RecentSignersFeed: React.FC<RecentSignersFeedProps> = ({
  language,
  signatures,
  onOpenVerify
}) => {
  const t = TRANSLATIONS[language];
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const filteredSignatures = selectedDistrict === 'all'
    ? signatures
    : signatures.filter(s => s.district === selectedDistrict);

  const getDistrictName = (code: string) => {
    const found = DISTRICTS.find(d => d.value === code);
    return found ? (language === 'si' ? found.si : language === 'ta' ? found.ta : found.en) : code;
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return language === 'si' ? 'මීට සුළු මොහොතකට පෙර' : 'Just now';
      if (diffMin < 60) return language === 'si' ? `මිනිත්තු ${diffMin} කට පෙර` : `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return language === 'si' ? `පැය ${diffHours} කට පෙර` : `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return language === 'si' ? `දින ${diffDays} කට පෙර` : `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <section className="py-12 bg-stone-900/60 border-b border-stone-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <Users className="w-4 h-4" />
              <span>{t.recentHeading}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-100 font-sinhala-display">
              {language === 'si' ? 'පෙත්සමට එක්වූ පුරවැසි හඬ' : 'Voices of the Citizens'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              {t.recentSubheading}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Filter by district */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-300 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">
                {language === 'si' ? 'සියලු දිස්ත්‍රික්ක (All Districts)' : 'All Districts'}
              </option>
              {DISTRICTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {language === 'si' ? d.si : language === 'ta' ? d.ta : d.en}
                </option>
              ))}
            </select>

            {/* Check my signature button */}
            <button
              onClick={onOpenVerify}
              className="px-3 py-2 rounded-xl bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900/50 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{language === 'si' ? 'අත්සන සොයන්න' : 'Verify Mine'}</span>
            </button>
          </div>
        </div>

        {/* List of Recent Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSignatures.slice(0, 12).map((sig) => (
            <div
              key={sig.id}
              className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800/80 hover:border-amber-900/40 transition space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-200 text-sm sm:text-base">
                      {sig.fullName}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>{t.verifiedBadge}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500/70" />
                      {getDistrictName(sig.district)}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-stone-500">
                      NIC: {maskNic(sig.nic)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(sig.createdAt)}</span>
                </div>
              </div>

              {/* Comment text */}
              {sig.comment && (
                <div className="text-xs sm:text-sm text-stone-300 bg-stone-900/60 p-3 rounded-xl border border-stone-800/50 italic flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500/70 shrink-0 mt-0.5" />
                  <span>"{sig.comment}"</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-900">
                <span className="font-mono">Ref: {sig.id}</span>
                <span className="text-amber-500/80 font-medium">අත්සන සටහන් විය ✓</span>
              </div>
            </div>
          ))}
        </div>

        {filteredSignatures.length === 0 && (
          <div className="p-12 text-center text-stone-500 bg-stone-950 rounded-2xl border border-stone-800">
            {t.noSignaturesYet}
          </div>
        )}

      </div>
    </section>
  );
};
