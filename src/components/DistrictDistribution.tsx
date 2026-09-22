import React from 'react';
import { Language, DistrictOption } from '../types';
import { DISTRICTS, TRANSLATIONS } from '../data/translations';
import { MapPin, Globe, Sparkles } from 'lucide-react';

interface DistrictDistributionProps {
  language: Language;
  districtStats: Record<string, number>;
  onSelectDistrict?: (districtCode: string) => void;
}

export const DistrictDistribution: React.FC<DistrictDistributionProps> = ({
  language,
  districtStats,
  onSelectDistrict
}) => {
  const t = TRANSLATIONS[language];

  return (
    <section id="district-distribution" className="py-10 sm:py-12 bg-stone-950 border-b border-stone-800">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {language === 'si'
                ? 'දිස්ත්‍රික්ක 25 සහ විදේශගත ලාංකික නියෝජනය'
                : language === 'ta'
                ? '25 மாவட்டங்கள் மற்றும் புலம்பெயர் பிரதிநிதித்துவம்'
                : '25 Districts & Diaspora Representation'}
            </span>
          </div>
          <h3 className="text-xl sm:text-3xl font-bold text-stone-100 font-sinhala-display">
            {language === 'si'
              ? 'දිස්ත්‍රික්ක මට්ටමින් සජීවී අත්සන්'
              : language === 'ta'
              ? 'மாவட்ட ரீதியான நேரடி கையொப்பங்கள்'
              : 'Live Signatures by District'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto">
            {language === 'si'
              ? 'අදාළ දිස්ත්‍රික්කය මත ක්ලික් කර එම දිස්ත්‍රික්කයේ අත්සන් කළ පුරවැසියන්ගේ ලැයිස්තුව බලන්න'
              : language === 'ta'
              ? 'அந்தந்த மாவட்டத்தை கிளிக் செய்து அங்கு கையொப்பமிட்டவர்களின் பட்டியலைப் பாருங்கள்'
              : 'Click on any district to view the list of citizen signers from that district'}
          </p>
        </div>

        {/* Top button to view ALL districts signatures */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <button
            onClick={() => onSelectDistrict && onSelectDistrict('all')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600/20 border border-amber-500/50 hover:bg-amber-600/30 text-amber-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {language === 'si'
                ? 'සියලු දිස්ත්‍රික්කවල අත්සන් ලේඛනය බලන්න (All Signatures)'
                : language === 'ta'
                ? 'அனைத்து மாவட்டங்களின் கையொப்பப் பட்டியலைப் பார்க்கவும்'
                : 'View All Signatures Directory'}
            </span>
          </button>
        </div>

        {/* District grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {DISTRICTS.map((d) => {
            const count = districtStats[d.value] || 0;
            const name = language === 'si' ? d.si.split(' (')[0] : language === 'ta' ? d.ta : d.en;

            return (
              <button
                key={d.value}
                onClick={() => onSelectDistrict && onSelectDistrict(d.value)}
                className="p-2.5 sm:p-3 rounded-xl bg-stone-900 border border-stone-800/90 hover:border-amber-500/70 hover:bg-stone-900/90 transition flex flex-col justify-between text-left group cursor-pointer"
                title={`${name} - ${count} ${language === 'si' ? 'අත්සන්' : 'signatures'}`}
              >
                <div className="flex items-center gap-1.5 text-xs text-stone-300 group-hover:text-amber-300 font-medium truncate">
                  <MapPin className="w-3 h-3 text-amber-500 group-hover:scale-110 transition shrink-0" />
                  <span className="truncate">{name}</span>
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
                  <span className={`text-xs font-bold font-mono ${count > 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                    {count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-500 group-hover:text-stone-400">
                    {language === 'si' ? 'අත්සන්' : language === 'ta' ? 'கையொப்பம்' : 'signed'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
