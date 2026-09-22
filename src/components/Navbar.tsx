import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Award, PenTool, Search, Share2, Globe, Users } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignClick: () => void;
  onVerifyClick: () => void;
  onShareClick: () => void;
  onAllSignaturesClick?: () => void;
  currentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  onSignClick,
  onVerifyClick,
  onShareClick,
  onAllSignaturesClick,
  currentCount
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-stone-950/90 border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Emblem & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-0.5 shadow-lg shadow-amber-600/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                5M GOAL
              </span>
              <span className="text-[11px] sm:text-xs text-stone-400 hidden xs:inline truncate">
                {currentCount.toLocaleString()} {language === 'si' ? 'අත්සන්' : 'signed'}
              </span>
            </div>
            <h1 className="text-xs sm:text-base font-bold text-stone-100 tracking-tight leading-snug truncate">
              {language === 'si' ? 'ලක්ෂ 50ක මහජන පෙත්සම' : language === 'ta' ? '50 இலட்சம் மக்கள் மனு' : '5 Million Citizen Petition'}
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language selector */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-[11px] sm:text-xs">
            <button
              onClick={() => onLanguageChange('si')}
              className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md font-medium transition ${
                language === 'si'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              සිං
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md font-medium transition ${
                language === 'en'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('ta')}
              className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md font-medium transition ${
                language === 'ta'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* All Signatures button (desktop / tablet) */}
          {onAllSignaturesClick && (
            <button
              onClick={onAllSignaturesClick}
              id="nav-all-signatures-btn"
              title="All Signatures"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-800/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-white transition text-xs font-medium"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>
                {language === 'si' ? 'සියලු අත්සන්' : language === 'ta' ? 'அனைத்து கையொப்பங்கள்' : 'All Signatures'}
              </span>
            </button>
          )}

          {/* Verify button */}
          <button
            onClick={onVerifyClick}
            id="nav-verify-btn"
            title="Verify signature"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white transition text-xs font-medium"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">
              {language === 'si' ? 'අත්සන සොයන්න' : language === 'ta' ? 'தேடுக' : 'Verify'}
            </span>
          </button>

          {/* Share button */}
          <button
            onClick={onShareClick}
            id="nav-share-btn"
            title="Share Petition"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 transition flex items-center gap-1.5 text-xs font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Sign Now CTA (Desktop / Tablet) */}
          <button
            onClick={onSignClick}
            id="nav-sign-cta-btn"
            className="hidden sm:flex px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-600/30 transition items-center gap-1.5 cursor-pointer"
          >
            <PenTool className="w-4 h-4" />
            <span>{language === 'si' ? 'අත්සන් කරන්න' : language === 'ta' ? 'கையொப்பமிடுக' : 'Sign Now'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
