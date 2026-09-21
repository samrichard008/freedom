import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Award, PenTool, Search, Share2, Globe } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignClick: () => void;
  onVerifyClick: () => void;
  onShareClick: () => void;
  currentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  onSignClick,
  onVerifyClick,
  onShareClick,
  currentCount
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-stone-950/85 border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
        {/* Left: Emblem & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-0.5 shadow-lg shadow-amber-600/20 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                5,000,000 GOAL
              </span>
              <span className="text-xs text-stone-400 hidden sm:inline">
                {currentCount.toLocaleString()} {language === 'si' ? 'අත්සන්' : 'signed'}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-stone-100 tracking-tight leading-snug">
              {language === 'si' ? 'ලක්ෂ 50ක මහජන පෙත්සම' : language === 'ta' ? '50 இலட்சம் மக்கள் மனு' : '5 Million Citizen Petition'}
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language selector */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onLanguageChange('si')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                language === 'si'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              සිංහල
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                language === 'en'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('ta')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                language === 'ta'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Verify button */}
          <button
            onClick={onVerifyClick}
            id="nav-verify-btn"
            title="Verify signature"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-stone-700 bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">
              {language === 'si' ? 'අත්සන සොයන්න' : language === 'ta' ? 'தேடுக' : 'Verify'}
            </span>
          </button>

          {/* Share button */}
          <button
            onClick={onShareClick}
            id="nav-share-btn"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 transition flex items-center gap-1.5 text-xs font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Sign Now CTA */}
          <button
            onClick={onSignClick}
            id="nav-sign-cta-btn"
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-600/30 transition flex items-center gap-1.5"
          >
            <PenTool className="w-4 h-4" />
            <span>{language === 'si' ? 'අත්සන් කරන්න' : language === 'ta' ? 'கையொப்பமிடுக' : 'Sign Now'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
