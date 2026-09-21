import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Scroll, Heart, ShieldAlert, Award, FileText } from 'lucide-react';

interface PetitionLetterCardProps {
  language: Language;
}

export const PetitionLetterCard: React.FC<PetitionLetterCardProps> = ({ language }) => {
  const t = TRANSLATIONS[language];

  return (
    <section id="petition-letter" className="py-12 bg-stone-900 border-b border-stone-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Memorandum Envelope Design */}
        <div className="rounded-3xl bg-stone-950 border border-amber-900/40 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle watermark background */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Scroll className="w-80 h-80 text-amber-400" />
          </div>

          {/* Header of Letter */}
          <div className="border-b border-amber-900/30 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                    {t.petitionNotice}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-100 font-sinhala-display">
                    {t.letterTitle}
                  </h2>
                </div>
              </div>

              <div className="text-xs text-stone-400 self-start sm:self-center px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                අංක: SL-PET-50LAKHS
              </div>
            </div>
          </div>

          {/* Body of Letter */}
          <div className="space-y-6 text-stone-200 text-base sm:text-lg leading-relaxed">
            {/* Salutation */}
            <div className="font-bold text-amber-300 text-lg sm:text-xl">
              {t.letterGreeting}
            </div>

            {/* Paragraph 1 */}
            <div className="p-4 rounded-xl bg-amber-950/20 border-l-4 border-amber-500 text-amber-100 font-medium">
              {t.letterBodyPara1}
            </div>

            {/* Paragraph 2 - 50 Lakhs Target */}
            <p>
              {t.letterBodyPara2}
            </p>

            {/* Paragraph 3 - Universal Love & Active Action */}
            <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>
                  {language === 'si'
                    ? 'සියලු මනුෂ්‍ය වර්ගයාට කරුණාවෙන්'
                    : language === 'ta'
                    ? 'அனைத்து மனிதகுலத்திற்கான அன்பு'
                    : 'Universal Humanity and Compassion'}
                </span>
              </div>
              <p className="text-stone-300 text-sm sm:text-base">
                {t.letterBodyPara3}
              </p>
            </div>

            {/* Paragraph 4 - Call to liberation & national duty */}
            <div className="space-y-3">
              <p className="text-stone-200 font-medium">
                {t.letterBodyPara4}
              </p>
            </div>

            {/* Highlighted Quote Box */}
            <blockquote className="my-6 p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-stone-900 to-amber-950/30 border border-amber-700/40 text-stone-100 font-medium italic text-base sm:text-lg">
              {t.letterBodyQuote}
            </blockquote>

            {/* Sign-off notice */}
            <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'si'
                    ? 'අත්සන් ලක්ෂ 50 ක මහජන පෙත්සම් කමිටුව'
                    : '5 Million Signatures Public Petition Initiative'}
                </span>
              </div>
              <div className="text-stone-400">
                ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජය
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
