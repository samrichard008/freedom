import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PenTool, Users, ShieldCheck, Flame, ChevronRight, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  language: Language;
  targetCount: number;
  currentCount: number;
  percentage: number;
  onSignClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  language,
  targetCount,
  currentCount,
  percentage,
  onSignClick
}) => {
  const t = TRANSLATIONS[language];
  const remaining = Math.max(0, targetCount - currentCount);

  return (
    <section className="relative overflow-hidden pt-6 pb-10 sm:pt-12 sm:pb-16 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-b border-stone-800">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-600/10 via-amber-700/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Quote, Call to Action */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold shadow-inner">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
              <span>{t.heroBadge}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-100 tracking-tight leading-tight font-sinhala-display">
              {t.title}
            </h1>

            {/* Presidential Appeal Subtitle */}
            <p className="text-sm sm:text-lg text-amber-400/90 font-medium">
              {t.subtitle}
            </p>

            {/* User's Exact Soulful Quote */}
            <div className="relative p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/20 border-l-4 border-amber-500 border-y border-r border-amber-900/30 shadow-xl">
              <p className="text-stone-200 text-xs sm:text-base leading-relaxed italic">
                {t.letterBodyQuote}
              </p>
              <div className="mt-2 text-[11px] sm:text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {language === 'si'
                    ? 'ජාතියේ යුතුකම වෙනුවෙන් පෙනී සිටිමු'
                    : language === 'ta'
                    ? 'நமது தேசிய கடமையை நிறைவேற்றுவோம்'
                    : 'Standing united for the national appeal'}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1 sm:pt-2 w-full">
              <button
                onClick={onSignClick}
                id="hero-sign-btn"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-600/30 transition flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
              >
                <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-stone-950 group-hover:rotate-12 transition-transform" />
                <span>{t.submitBtn}</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#petition-letter"
                className="w-full sm:w-auto px-5 py-3 sm:py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/80 font-medium text-xs sm:text-base transition flex items-center justify-center gap-2 text-center"
              >
                <span>
                  {language === 'si'
                    ? 'පෙත්සම් ලිපිය කියවන්න'
                    : language === 'ta'
                    ? 'மனுவின் முழு விவரம்'
                    : 'Read Petition Letter'}
                </span>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-stone-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                {language === 'si' ? 'NIC සත්‍යාපනය' : 'NIC Verified'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                {language === 'si' ? 'දිස්ත්‍රික්ක 25ම ආවරණය' : 'All 25 Districts'}
              </span>
            </div>
          </div>

          {/* Right Column: Visual Portrait & Big Progress Gauge */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {/* Visual Portrait Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/40 p-3.5 sm:p-5 shadow-2xl relative">
              <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-950 via-stone-900 to-amber-900/60 border border-amber-800/40 flex flex-col justify-end p-3.5 sm:p-5 group">
                {/* Authentic Portrait Image */}
                <img
                  id="hero-gnanasara-portrait"
                  src="/gnanasara.png"
                  alt={language === 'si' ? 'පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමි' : 'Ven. Galagoda Aththe Gnanasara Thero'}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-105 filter brightness-95 contrast-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('gnanasara.png')) {
                      target.src = '/image.png';
                    } else if (target.src.includes('image.png')) {
                      target.src = '/gnanasara_thero.jpg';
                    }
                  }}
                />

                {/* Subtle gradient vignette to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-amber-950/15 mix-blend-overlay pointer-events-none" />

                {/* Saffron Sash Badge */}
                <div className="relative z-10 space-y-1.5 drop-shadow-md">
                  <div className="inline-block px-3 py-1 rounded-md bg-amber-600/90 text-stone-950 font-extrabold text-xs uppercase tracking-wider shadow">
                    {language === 'si' ? 'ජනාධිපති සමාව ඉල්ලා' : 'Presidential Pardon'}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-amber-200">
                    {language === 'si' ? 'පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමි' : 'Ven. Galagoda Aththe Gnanasara Thero'}
                  </h3>
                  <p className="text-xs text-stone-300 font-medium">
                    {language === 'si' 
                      ? 'අත්සන් ලක්ෂ 50 ක මහජන පෙත්සම ගරු ජනාධිපතිතුමන් වෙත භාරදීම'
                      : '5 Million Signatures to be presented to His Excellency the President'}
                  </p>
                </div>
              </div>

              {/* Progress Card */}
              <div className="mt-4 sm:mt-5 p-3.5 sm:p-5 rounded-2xl bg-stone-950/80 border border-amber-800/30 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400 block truncate">
                      {t.signedLabel}
                    </span>
                    <div className="text-xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                      {currentCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] sm:text-xs text-stone-400 block">
                      {t.targetLabel}
                    </span>
                    <div className="text-sm sm:text-lg font-bold text-amber-300">
                      {targetCount.toLocaleString()} <span className="text-xs text-amber-400/80 font-normal hidden xs:inline">(ලක්ෂ 50)</span>
                    </div>
                  </div>
                </div>

                {/* Main Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3.5 sm:h-4 rounded-full bg-stone-800/90 overflow-hidden p-0.5 border border-stone-700/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-700 shadow-md shadow-amber-500/50"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs text-stone-400 font-medium">
                    <span>{percentage}% {t.percentageLabel}</span>
                    <span className="text-amber-400 font-semibold truncate ml-2">
                      {remaining.toLocaleString()} {t.remainingLabel}
                    </span>
                  </div>
                </div>

                {/* Milestone breakdown markers */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-stone-800 text-center text-xs">
                  <div className="p-1 sm:p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-[11px] sm:text-xs">100,000</div>
                    <div className={`text-[9px] sm:text-[10px] font-medium truncate ${currentCount >= 100000 ? 'text-emerald-400' : 'text-stone-500'}`}>
                      {currentCount >= 100000 ? '✓ Passed' : 'ඉලක්කය 1'}
                    </div>
                  </div>
                  <div className="p-1 sm:p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-300 font-bold text-[11px] sm:text-xs">1,000,000</div>
                    <div className={`text-[9px] sm:text-[10px] font-medium truncate ${currentCount >= 1000000 ? 'text-emerald-400' : 'text-stone-500'}`}>
                      {currentCount >= 1000000 ? '✓ Passed' : 'ඉලක්කය 2'}
                    </div>
                  </div>
                  <div className="p-1 sm:p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                    <div className="text-stone-200 font-bold text-[11px] sm:text-xs">5M (50L)</div>
                    <div className="text-[9px] sm:text-[10px] text-amber-400 font-medium truncate">මහා ඉලක්කය</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
