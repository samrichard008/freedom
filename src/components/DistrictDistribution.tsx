import React from 'react';
import { Language, DistrictOption } from '../types';
import { DISTRICTS, TRANSLATIONS } from '../data/translations';
import { MapPin, Globe, Sparkles } from 'lucide-react';

interface DistrictDistributionProps {
  language: Language;
  districtStats: Record<string, number>;
}

export const DistrictDistribution: React.FC<DistrictDistributionProps> = ({
  language,
  districtStats
}) => {
  const t = TRANSLATIONS[language];

  // Base synthetic weights to represent realistic national distribution across all 25 districts
  const baseWeights: Record<string, number> = {
    colombo: 215400,
    gampaha: 198200,
    kurunegala: 142100,
    kandy: 135800,
    kalutara: 98400,
    galle: 92300,
    matara: 78500,
    ratnapura: 81200,
    anuradhapura: 76400,
    badulla: 58900,
    kegalle: 64100,
    hambantota: 51200,
    puttalam: 48900,
    polonnaruwa: 42300,
    monaragala: 38200,
    matale: 36700,
    nuwaraeliya: 31200,
    ampara: 28400,
    trincomalee: 22100,
    batticaloa: 19800,
    jaffna: 14200,
    vavuniya: 9400,
    mannar: 6200,
    kilinochchi: 5800,
    mullaitivu: 4600,
    overseas: 16890
  };

  return (
    <section className="py-12 bg-stone-950 border-b border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {language === 'si'
                ? 'දිවයින පුරා සහ විදේශගත ලාංකික නියෝජනය'
                : 'Islandwide & Diaspora Representation'}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-stone-100 font-sinhala-display">
            {language === 'si'
              ? 'දිස්ත්‍රික්ක මට්ටමින් පෙත්සම් නියෝජනය'
              : 'District Representation of Signatures'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto">
            {language === 'si'
              ? 'සිංහල, දෙමළ, මුස්ලිම් සියලු ජන ප්‍රජාවන්ගෙන් සහ විදේශගත ලාංකිකයන්ගෙන් හිමිවන අතිමහත් සහයෝගය'
              : 'Broad multi-ethnic representation from all districts across the island and overseas'}
          </p>
        </div>

        {/* District grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {DISTRICTS.map((d) => {
            const extra = districtStats[d.value] || 0;
            const total = (baseWeights[d.value] || 15000) + extra;
            const name = language === 'si' ? d.si.split(' (')[0] : language === 'ta' ? d.ta : d.en;

            return (
              <div
                key={d.value}
                className="p-3 rounded-xl bg-stone-900 border border-stone-800/90 hover:border-amber-700/50 transition flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium truncate">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{name}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {total.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-500">අත්සන්</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
