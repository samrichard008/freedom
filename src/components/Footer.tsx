import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Award, Heart, Shield, Share2 } from 'lucide-react';

interface FooterProps {
  language: Language;
  onShareClick: () => void;
  onSignClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onShareClick, onSignClick }) => {
  const t = TRANSLATIONS[language];

  return (
    <footer className="bg-stone-950 border-t border-stone-800 text-stone-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-800/80">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-200">
                {language === 'si'
                  ? 'අත්සන් ලක්ෂ 50ක මහජන පෙත්සම් ලේඛනාගාරය'
                  : '5 Million Signatures National Petition Registry'}
              </div>
              <div className="text-xs text-stone-500">
                පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන් වෙනුවෙන් ජනාධිපති සමාව ඉල්ලා සිටීම
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSignClick}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition"
            >
              {language === 'si' ? 'දැන්ම අත්සන් කරන්න' : 'Sign Petition'}
            </button>
            <button
              onClick={onShareClick}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition flex items-center gap-1.5 border border-stone-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* National unity & compassionate statement */}
        <div className="text-center max-w-2xl mx-auto space-y-2 text-xs text-stone-400">
          <p className="flex items-center justify-center gap-1.5 text-stone-300">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {language === 'si'
                ? 'සියළුම මනුස්ස වර්ගයාට ජාති ආගම් බේදයකින් තොරව ආදරය කරමු. ජාතියේ යුතුකම ඉටු කරමු.'
                : 'Fostering compassion and mutual understanding for all communities of Sri Lanka.'}
            </span>
          </p>
          <p className="text-[11px] text-stone-500">
            {language === 'si'
              ? 'මෙම පෙත්සම ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජයේ ආණ්ඩුක්‍රම ව්‍යවස්ථාවේ 34 වන වගන්තිය ප්‍රකාරව ජනාධිපති සමාව ඉල්ලා ඉදිරිපත් කෙරෙන සාමකාමී පුරවැසි ප්‍රකාශනයකි.'
              : 'This petition is a peaceful citizens appeal submitted under Article 34 of the Constitution of the Democratic Socialist Republic of Sri Lanka.'}
          </p>
        </div>

      </div>
    </footer>
  );
};
