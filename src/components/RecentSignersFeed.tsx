import React, { useState } from 'react';
import { Language, Signature } from '../types';
import { TRANSLATIONS, DISTRICTS } from '../data/translations';
import { maskNic } from '../data/petitionStore';
import { Users, CheckCircle, MessageSquare, MapPin, Clock, Search } from 'lucide-react';

interface RecentSignersFeedProps {
  language: Language;
  signatures: Signature[];
  onOpenVerify: () => void;
  onViewAll?: (district?: string) => void;
  onSignClick?: () => void;
  onSelectSignature?: (sig: Signature) => void;
}

export const RecentSignersFeed: React.FC<RecentSignersFeedProps> = ({
  language,
  signatures,
  onOpenVerify,
  onViewAll,
  onSignClick,
  onSelectSignature
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
      if (diffMin < 1) return language === 'si' ? 'මීට සුළු මොහොතකට පෙර' : language === 'ta' ? 'இப்போதுதான்' : 'Just now';
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
    <section id="recent-signers-section" className="py-10 sm:py-12 bg-stone-900/60 border-b border-stone-800">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <Users className="w-4 h-4" />
              <span>{t.recentHeading}</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-bold text-stone-100 font-sinhala-display">
              {language === 'si' ? 'පෙත්සමට එක්වූ පුරවැසි හඬ' : language === 'ta' ? 'மனுவில் இணைந்த குடிமக்கள் குரல்' : 'Voices of the Citizens'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              {language === 'si' 
                ? 'සජීවීව අත්සන් තැබූ නවතම පුරවැසියන් 10 දෙනාගේ තොරතුරු'
                : language === 'ta'
                ? 'நேரடியாக கையொப்பமிட்ட சமீபத்திய 10 நபர்களின் விவரங்கள்'
                : 'Latest 10 live verified citizen signers'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by district */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-300 text-xs focus:outline-none focus:border-amber-500 cursor-pointer min-w-[140px]"
            >
              <option value="all">
                {language === 'si' ? 'සියලු දිස්ත්‍රික්ක' : 'All Districts'}
              </option>
              {DISTRICTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {language === 'si' ? d.si : language === 'ta' ? d.ta : d.en}
                </option>
              ))}
            </select>

            {/* View All Signatures Button (50 per page) */}
            <button
              onClick={() => onViewAll && onViewAll(selectedDistrict)}
              className="px-3 py-2 rounded-xl bg-amber-600/20 border border-amber-500/50 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'si' ? 'සියලු අත්සන් (All)' : language === 'ta' ? 'அனைத்து கையொப்பங்கள்' : 'All Signatures'}</span>
            </button>

            {/* Check my signature button */}
            <button
              onClick={onOpenVerify}
              className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'si' ? 'අත්සන සොයන්න' : language === 'ta' ? 'தேடுக' : 'Verify'}</span>
            </button>
          </div>
        </div>

        {/* List of Recent Signatures - strictly latest 10 as requested */}
        {filteredSignatures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSignatures.slice(0, 10).map((sig) => (
              <div
                key={sig.id}
                onClick={() => onSelectSignature && onSelectSignature(sig)}
                className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800/80 hover:border-amber-500/50 hover:bg-stone-950/90 transition space-y-3 shadow-md cursor-pointer group"
                title="Click to view official certificate"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-200 text-sm sm:text-base group-hover:text-amber-300 transition">
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
                  <span className="text-amber-400 group-hover:underline font-medium">
                    {language === 'si' ? 'සහතිකය බලන්න →' : language === 'ta' ? 'சான்றிதழைப் பார் →' : 'View Certificate →'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-stone-950 rounded-2xl border border-stone-800 space-y-4">
            <Users className="w-12 h-12 text-stone-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-stone-300">
                {language === 'si' 
                  ? 'තවමත් සජීවී අත්සන් නොමැත' 
                  : language === 'ta' 
                  ? 'இன்னும் கையொப்பங்கள் இல்லை' 
                  : 'No live signatures yet'}
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                {language === 'si' 
                  ? 'පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන් වෙනුවෙන් ජනාධිපති සමාව ඉල්ලා පළමු අත්සන ඔබේ කරන්න!' 
                  : language === 'ta' 
                  ? 'ஞானசார தேரருக்கு பொதுமன்னிப்பு கோரும் மனுவில் முதல் கையொப்பத்தை நீங்கள் இடுங்கள்!' 
                  : 'Be the first citizen to sign this historic petition urging presidential pardon for Ven. Gnanasara Thero!'}
              </p>
            </div>
            {onSignClick && (
              <button
                onClick={onSignClick}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-600/20"
              >
                {language === 'si' ? 'දැන්ම අත්සන් කරන්න' : language === 'ta' ? 'இப்போதே கையொப்பமிடுக' : 'Sign Now'}
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
