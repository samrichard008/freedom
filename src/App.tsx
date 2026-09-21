import React, { useState, useEffect } from 'react';
import { Language, Signature, PetitionStats } from './types';
import { 
  getPetitionStats, 
  getStoredSignatures, 
  addSignature 
} from './data/petitionStore';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PetitionLetterCard } from './components/PetitionLetterCard';
import { PetitionForm } from './components/PetitionForm';
import { RecentSignersFeed } from './components/RecentSignersFeed';
import { DistrictDistribution } from './components/DistrictDistribution';
import { CertificateModal } from './components/CertificateModal';
import { VerifyModal } from './components/VerifyModal';
import { ShareModal } from './components/ShareModal';
import { Footer } from './components/Footer';

export default function App() {
  const [language, setLanguage] = useState<Language>('si');
  const [stats, setStats] = useState<PetitionStats>(() => getPetitionStats());
  const [signatures, setSignatures] = useState<Signature[]>(() => getStoredSignatures());

  const [activeCertSignature, setActiveCertSignature] = useState<Signature | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Sync state whenever signatures change
  const refreshData = () => {
    setStats(getPetitionStats());
    setSignatures(getStoredSignatures());
  };

  // Periodic simulated live ticks to show live nation-wide petition momentum
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        const increment = Math.floor(Math.random() * 2) + 1;
        const newCount = prev.currentCount + increment;
        const newPercentage = Number(((newCount / prev.target) * 100).toFixed(2));
        return {
          ...prev,
          currentCount: newCount,
          percentage: newPercentage
        };
      });
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const handleSignSuccess = (newSig: Signature) => {
    refreshData();
    setActiveCertSignature(newSig);
  };

  const scrollToSign = () => {
    const el = document.getElementById('sign-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      // Focus on name input
      setTimeout(() => {
        const input = document.getElementById('signer-name-input');
        if (input) input.focus();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 py-1.5 px-4 text-center text-stone-950 font-bold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2">
        <span className="animate-pulse">●</span>
        <span>
          {language === 'si'
            ? 'පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන් වෙනුවෙන් ජනාධිපති සමාව ඉල්ලා අස්සන් ලක්ෂ 50 ක මහජන පෙත්සම'
            : language === 'ta'
            ? 'ஞானசார தேரருக்கு ஜனாதிபதி பொதுமன்னிப்பு கோரும் 50 இலட்சம் கையெழுத்து மனு'
            : '5 Million Signature National Petition Urging Presidential Pardon for Ven. Gnanasara Thero'}
        </span>
      </div>

      {/* Navigation */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        onSignClick={scrollToSign}
        onVerifyClick={() => setShowVerifyModal(true)}
        onShareClick={() => setShowShareModal(true)}
        currentCount={stats.currentCount}
      />

      <main className="flex-1">
        {/* Hero with Progress Bar and Monastic Portrait */}
        <Hero
          language={language}
          targetCount={stats.target}
          currentCount={stats.currentCount}
          percentage={stats.percentage}
          onSignClick={scrollToSign}
        />

        {/* Petition Letter with User's Exact Prompt Text */}
        <PetitionLetterCard language={language} />

        {/* Online Signing Form with Canvas Signature Pad & NIC Verification */}
        <PetitionForm
          language={language}
          onSuccess={handleSignSuccess}
        />

        {/* Live Feed of Recent Citizens Signing */}
        <RecentSignersFeed
          language={language}
          signatures={signatures}
          onOpenVerify={() => setShowVerifyModal(true)}
        />

        {/* Islandwide District Breakdown */}
        <DistrictDistribution
          language={language}
          districtStats={stats.districtStats}
        />
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onShareClick={() => setShowShareModal(true)}
        onSignClick={scrollToSign}
      />

      {/* Certificate Modal on successful sign or lookup */}
      {activeCertSignature && (
        <CertificateModal
          language={language}
          signature={activeCertSignature}
          onClose={() => setActiveCertSignature(null)}
          onSignAnother={() => {
            setActiveCertSignature(null);
            scrollToSign();
          }}
        />
      )}

      {/* Verification Lookup Modal */}
      {showVerifyModal && (
        <VerifyModal
          language={language}
          onClose={() => setShowVerifyModal(false)}
          onSelectSignature={(sig) => setActiveCertSignature(sig)}
        />
      )}

      {/* Social Sharing Modal */}
      {showShareModal && (
        <ShareModal
          language={language}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
