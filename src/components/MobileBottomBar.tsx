import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PenTool, Users, Search, Share2 } from 'lucide-react';

interface MobileBottomBarProps {
  language: Language;
  onSignClick: () => void;
  onAllSignaturesClick: () => void;
  onVerifyClick: () => void;
  onShareClick: () => void;
  totalSignatures: number;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  language,
  onSignClick,
  onAllSignaturesClick,
  onVerifyClick,
  onShareClick,
  totalSignatures
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-stone-950/95 backdrop-blur-lg border-t border-amber-900/50 px-3 py-2 shadow-2xl safe-area-bottom">
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        {/* Sign Now Primary Action */}
        <button
          onClick={onSignClick}
          id="mobile-bottom-sign-btn"
          className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 active:scale-95 transition cursor-pointer"
        >
          <PenTool className="w-4 h-4 text-stone-950 shrink-0" />
          <span className="truncate">
            {language === 'si' ? 'අත්සන් කරන්න' : language === 'ta' ? 'கையொப்பமிடுக' : 'Sign Now'}
          </span>
        </button>

        {/* All Signatures */}
        <button
          onClick={onAllSignaturesClick}
          id="mobile-bottom-all-btn"
          title="All Signatures"
          className="p-2 sm:px-2.5 rounded-xl bg-stone-900 border border-stone-800 text-amber-300 hover:text-white flex flex-col items-center justify-center gap-0.5 min-w-[50px] active:scale-95 transition"
        >
          <div className="relative">
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] font-medium leading-none">
            {language === 'si' ? 'අත්සන්' : language === 'ta' ? 'பட்டியல்' : 'All'}
          </span>
        </button>

        {/* Verify Search */}
        <button
          onClick={onVerifyClick}
          id="mobile-bottom-verify-btn"
          title="Verify Signature"
          className="p-2 sm:px-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white flex flex-col items-center justify-center gap-0.5 min-w-[50px] active:scale-95 transition"
        >
          <Search className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-medium leading-none">
            {language === 'si' ? 'සොයන්න' : language === 'ta' ? 'தேடுக' : 'Verify'}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={onShareClick}
          id="mobile-bottom-share-btn"
          title="Share Petition"
          className="p-2 sm:px-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:text-white flex flex-col items-center justify-center gap-0.5 min-w-[50px] active:scale-95 transition"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-[10px] font-medium leading-none">
            {language === 'si' ? 'බෙදන්න' : language === 'ta' ? 'பகிர்க' : 'Share'}
          </span>
        </button>
      </div>
    </div>
  );
};
