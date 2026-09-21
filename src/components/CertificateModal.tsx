import React, { useState } from 'react';
import { Signature, Language } from '../types';
import { TRANSLATIONS, DISTRICTS } from '../data/translations';
import { maskNic } from '../data/petitionStore';
import { 
  CheckCircle2, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  X, 
  Award, 
  Printer, 
  MessageCircle,
  ExternalLink 
} from 'lucide-react';

interface CertificateModalProps {
  language: Language;
  signature: Signature | null;
  onClose: () => void;
  onSignAnother: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  language,
  signature,
  onClose,
  onSignAnother
}) => {
  const [copied, setCopied] = useState(false);
  if (!signature) return null;

  const t = TRANSLATIONS[language];
  const districtObj = DISTRICTS.find(d => d.value === signature.district);
  const districtName = districtObj ? (language === 'si' ? districtObj.si : language === 'ta' ? districtObj.ta : districtObj.en) : signature.district;

  const petitionUrl = window.location.href;
  const shareTextSinhala = `පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන් වෙනුවෙන් ජනාධිපති සමාව ඉල්ලා අත්සන් ලක්ෂ 50ක මහජන පෙත්සමට මම අත්සන් කළෙමි (අංක: ${signature.id})! ඔබත් දැන්ම අත්සන් කර උන්වහන්සේගේ නිදහස වෙනුවෙන් පෙනී සිටින්න: ${petitionUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(petitionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTextSinhala)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-800/60 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          id="cert-modal-close-btn"
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Celebration Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-stone-100 font-sinhala-display">
            {t.successTitle}
          </h3>
          <p className="text-sm text-stone-400 max-w-md mx-auto">
            {t.successSubtitle}
          </p>
        </div>

        {/* Official Printable Certificate Card */}
        <div 
          id="printable-certificate"
          className="p-6 rounded-2xl bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-2 border-amber-600/60 shadow-xl space-y-5 relative overflow-hidden"
        >
          {/* Subtle ornate border flourish */}
          <div className="absolute top-2 left-2 text-amber-500/40 text-xs">❖</div>
          <div className="absolute top-2 right-2 text-amber-500/40 text-xs">❖</div>
          <div className="absolute bottom-2 left-2 text-amber-500/40 text-xs">❖</div>
          <div className="absolute bottom-2 right-2 text-amber-500/40 text-xs">❖</div>

          <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                ශ්‍රී ලංකා ජාතික පෙත්සම් ලේඛනය
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800/40">
              {signature.id}
            </span>
          </div>

          <div className="text-center py-2 space-y-1">
            <div className="text-xs text-stone-400">පෙත්සම් අත්සන්කරු:</div>
            <div className="text-xl sm:text-2xl font-bold text-stone-100">
              {signature.fullName}
            </div>
            <div className="text-xs text-amber-400/90 font-mono">
              NIC: {maskNic(signature.nic)} • {districtName}
            </div>
          </div>

          {/* User's signature view */}
          <div className="py-2 border-y border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-stone-400">
              <div>දිනය හා වේලාව:</div>
              <div className="text-stone-200 font-medium">
                {new Date(signature.createdAt).toLocaleString(language === 'si' ? 'si-LK' : 'en-US')}
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-[11px] text-stone-500 mb-1">ඩිජිටල් අත්සන (Digital Signature):</div>
              {signature.signatureDataUrl ? (
                <img
                  src={signature.signatureDataUrl}
                  alt="Signer Signature"
                  className="h-10 max-w-[160px] object-contain rounded border border-amber-900/40 bg-stone-950 p-1"
                />
              ) : (
                <div className="text-amber-400 italic font-serif text-sm border-b border-amber-500/40 px-3">
                  {signature.fullName}
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-stone-400 text-center leading-relaxed">
            “පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන් වෙනුවෙන් ජනාධිපති සමාව ඉල්ලා අස්සන් ලක්ෂ 50ක මහජන පෙත්සමට මාගේ සහයෝගය නිල වශයෙන් එක් කරමි.”
          </div>
        </div>

        {/* Share Section */}
        <div className="space-y-3 pt-2">
          <div className="text-center">
            <h4 className="text-sm font-bold text-stone-200">
              {t.shareHeading}
            </h4>
            <p className="text-xs text-stone-400">
              {t.shareSubheading}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              id="whatsapp-share-modal-btn"
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.whatsappShare}</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookShare}
              id="facebook-share-modal-btn"
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.facebookShare}</span>
            </button>
          </div>

          <div className="flex gap-2">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              id="copy-link-modal-btn"
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition border border-stone-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.copied : t.copyLink}</span>
            </button>

            {/* Print Slip */}
            <button
              onClick={handlePrint}
              id="print-cert-modal-btn"
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition border border-stone-700 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
          <button
            onClick={onSignAnother}
            className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4 cursor-pointer"
          >
            {t.signAnother}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white transition"
          >
            වසන්න (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
