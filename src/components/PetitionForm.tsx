import React, { useState } from 'react';
import { Language, Signature } from '../types';
import { TRANSLATIONS, DISTRICTS } from '../data/translations';
import { SignaturePad } from './SignaturePad';
import { addSignature } from '../data/petitionStore';
import { CheckCircle2, AlertCircle, PenTool, ShieldCheck, HeartHandshake } from 'lucide-react';

interface PetitionFormProps {
  language: Language;
  onSuccess: (sig: Signature) => void;
}

export const PetitionForm: React.FC<PetitionFormProps> = ({ language, onSuccess }) => {
  const t = TRANSLATIONS[language];

  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('colombo');
  const [comment, setComment] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [agreed, setAgreed] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate NIC Format (Old 9 digits + V/X, or New 12 digits)
  const validateNic = (val: string): boolean => {
    const clean = val.trim().toUpperCase();
    const oldRegex = /^[0-9]{9}[VX]$/;
    const newRegex = /^[0-9]{12}$/;
    return oldRegex.test(clean) || newRegex.test(clean);
  };

  const isNicValid = !nic.trim() || validateNic(nic);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError(language === 'si' ? 'කරුණාකර ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න' : 'Please enter your full name');
      return;
    }

    if (!nic.trim()) {
      setError(language === 'si' ? 'කරුණාකර ඔබේ ජාතික හැඳුනුම්පත් අංකය (NIC) ඇතුළත් කරන්න' : 'Please enter your NIC number');
      return;
    }

    if (!validateNic(nic)) {
      setError(
        language === 'si'
          ? 'වලංගු නොවන හැඳුනුම්පත් අංකයකි. පැරණි (අංක 9 + V) හෝ නව (අංක 12) ආකෘතිය භාවිත කරන්න.'
          : 'Invalid NIC format. Use 9 digits + V/X or 12 digits.'
      );
      return;
    }

    if (!phone.trim()) {
      setError(language === 'si' ? 'කරුණාකර ඔබේ දුරකථන අංකය ඇතුළත් කරන්න' : 'Please enter your phone number');
      return;
    }

    if (!agreed) {
      setError(language === 'si' ? 'පෙත්සම ඉදිරිපත් කිරීමට පෙර එකඟතාව පළ කළ යුතුය' : 'You must agree with the petition to sign');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = addSignature({
        fullName,
        nic,
        phone,
        district,
        comment,
        signatureDataUrl: signatureData
      });

      setLoading(false);

      if (!result.success) {
        setError(result.error || 'Failed to submit signature');
        return;
      }

      onSuccess(result.signature);
    }, 600);
  };

  return (
    <section id="sign-form-section" className="py-12 sm:py-16 bg-stone-950 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Main Form Container */}
        <div className="rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/50 p-6 sm:p-10 shadow-2xl space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2 border-b border-stone-800 pb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
              <PenTool className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-sinhala-display tracking-tight">
              {t.formTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto">
              {t.formSubtitle}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                <span>{t.nameLabel} <span className="text-amber-500">*</span></span>
                <span className="text-[11px] text-stone-500 font-normal">නීත්‍යානුකූල නම</span>
              </label>
              <input
                type="text"
                id="signer-name-input"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm sm:text-base transition"
              />
            </div>

            {/* NIC & Phone side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NIC */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                  <span>{t.nicLabel} <span className="text-amber-500">*</span></span>
                  <span className="text-[11px] text-stone-500 font-normal">9-V / 12 අංක</span>
                </label>
                <input
                  type="text"
                  id="signer-nic-input"
                  required
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  placeholder={t.nicPlaceholder}
                  className={`w-full px-4 py-3 rounded-xl bg-stone-950 border text-stone-100 placeholder-stone-600 focus:outline-none text-sm sm:text-base uppercase tracking-wider transition ${
                    !isNicValid
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                {!isNicValid && (
                  <p className="text-[11px] text-rose-400">
                    වලංගු NIC අංකයක් ඇතුළත් කරන්න (උදා: 851234567V හෝ 198512345678)
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300">
                  {t.phoneLabel} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="tel"
                  id="signer-phone-input"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm sm:text-base transition"
                />
              </div>
            </div>

            {/* District Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                {t.districtLabel} <span className="text-amber-500">*</span>
              </label>
              <select
                id="signer-district-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm sm:text-base transition cursor-pointer"
              >
                {DISTRICTS.map((d) => (
                  <option key={d.value} value={d.value} className="bg-stone-900 text-stone-100 py-1">
                    {language === 'si' ? d.si : language === 'ta' ? d.ta : d.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Support Message / Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                {t.commentLabel}
              </label>
              <textarea
                id="signer-comment-input"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition"
              />
            </div>

            {/* Digital Signature Pad */}
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800">
              <SignaturePad
                language={language}
                signerName={fullName}
                onSignatureChange={(sig) => setSignatureData(sig)}
              />
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-stone-950 border border-stone-800/80 cursor-pointer hover:border-amber-800/60 transition">
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-stone-700 text-amber-600 focus:ring-amber-500 bg-stone-900"
              />
              <span className="text-xs sm:text-sm text-stone-300 leading-snug">
                {t.agreeCheckbox}
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              id="submit-petition-btn"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-base sm:text-lg shadow-xl shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>{t.submittingBtn}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-stone-950" />
                  <span>{t.submitBtn}</span>
                </>
              )}
            </button>

            {/* Privacy notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
              <span>
                {language === 'si'
                  ? 'ඔබේ NIC අංකය ප්‍රසිද්ධියේ ප්‍රදර්ශනය නොකෙරේ. ආරක්ෂිතව සත්‍යාපනය පමණක් කෙරේ.'
                  : 'Your NIC is kept confidential and only used for legitimate signature verification.'}
              </span>
            </div>

          </form>

        </div>

      </div>
    </section>
  );
};
