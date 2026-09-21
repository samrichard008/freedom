import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { 
  X, 
  MessageCircle, 
  Share2, 
  Copy, 
  Check, 
  Send, 
  Globe 
} from 'lucide-react';

interface ShareModalProps {
  language: Language;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ language, onClose }) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  const petitionUrl = window.location.href;
  const shareText = `පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන් වෙනුවෙන් ජනාධිපති සමාව ඉල්ලා අස්සන් ලක්ෂ 50ක මහජන පෙත්සමට ඔබත් දැන්ම අත්සන් කරන්න: ${petitionUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(petitionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(petitionUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-100 font-sinhala-display">
            {t.shareHeading}
          </h3>
          <p className="text-xs text-stone-400">
            {t.shareSubheading}
          </p>
        </div>

        {/* Share buttons grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="p-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <MessageCircle className="w-6 h-6" />
            <span>WhatsApp</span>
          </button>

          {/* Facebook */}
          <button
            onClick={handleFacebook}
            className="p-3 rounded-2xl bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Share2 className="w-6 h-6" />
            <span>Facebook</span>
          </button>

          {/* Twitter / X */}
          <button
            onClick={handleTwitter}
            className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer border border-stone-700"
          >
            <Globe className="w-6 h-6 text-stone-300" />
            <span>X (Twitter)</span>
          </button>

          {/* Telegram */}
          <button
            onClick={handleTelegram}
            className="p-3 rounded-2xl bg-sky-600/90 hover:bg-sky-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Send className="w-6 h-6" />
            <span>Telegram</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5">
          <label className="text-xs text-stone-400 font-medium">පෙත්සමේ ලින්ක් එක (Petition URL):</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={petitionUrl}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-300 text-xs truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
