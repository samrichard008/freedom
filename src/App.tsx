import React, { useState, useEffect } from 'react';
import { Language, Signature, PetitionStats } from './types';
import { 
  getPetitionStats, 
  getStoredSignatures, 
  calculateStats,
  subscribeToSignatures 
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
import { AllSignaturesModal } from './components/AllSignaturesModal';
import { MobileBottomBar } from './components/MobileBottomBar';
import { Footer } from './components/Footer';
import { Database, Play, RefreshCw, CheckCircle, AlertTriangle, ArrowLeft, Terminal, ShieldAlert, FileText } from 'lucide-react';

// Migration Dashboard sub-component
function MigrationDashboard() {
  const [logs, setLogs] = useState<string[]>(['[System] Migration Dashboard initialized. Choose a method below to begin.']);
  const [isMigrating, setIsMigrating] = useState(false);
  const [totalFetched, setTotalFetched] = useState(0);
  const [totalNew, setTotalNew] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [batchLimit, setBatchLimit] = useState(1000);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [localOffset, setLocalOffset] = useState(0);
  const [migrationType, setMigrationType] = useState<'local' | 'firebase'>('local');

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const handleStartMigration = async () => {
    if (migrationType === 'local') {
      await handleLocalBackupMigration();
    } else {
      await handleFirebaseMigration();
    }
  };

  const handleLocalBackupMigration = async () => {
    if (isMigrating) return;
    setIsMigrating(true);
    setStatus('running');
    addLog(`Starting local backup migration batch processing (Offset: ${localOffset}, Limit: ${batchLimit})...`);

    let currentOffset = localOffset;

    try {
      while (true) {
        addLog(`Processing batch starting from offset ${currentOffset}...`);
        const url = `/api/migrate-local-backup?offset=${currentOffset}&limit=${batchLimit}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'API returned failure status');
        }

        const count = data.count || 0;
        const newlyMigrated = data.migratedCount || 0;
        const nextOffset = data.nextOffset;

        if (count === 0) {
          addLog('🎉 Local backup migration complete! All local signatures merged.');
          setStatus('completed');
          setIsMigrating(false);
          break;
        }

        setTotalFetched(prev => prev + count);
        setTotalNew(prev => prev + newlyMigrated);
        setLocalOffset(nextOffset);
        currentOffset = nextOffset;

        addLog(`✅ Batch Success: Processed ${count} local signatures. Newly inserted: ${newlyMigrated}. Duplicates skipped: ${count - newlyMigrated}.`);

        // Give the database / Vercel some breathing room
        await new Promise(r => setTimeout(r, 400));

        if (!nextOffset || nextOffset >= data.totalInBackup) {
          addLog('🎉 Local backup migration complete! All local signatures merged successfully.');
          setStatus('completed');
          setIsMigrating(false);
          break;
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
      setStatus('error');
      setIsMigrating(false);
      addLog(`❌ Critical Error: ${err.message || String(err)}`);
    }
  };

  const handleFirebaseMigration = async () => {
    if (isMigrating) return;
    setIsMigrating(true);
    setStatus('running');
    addLog(`Starting Firebase live database migration batch processing (Limit: ${batchLimit})...`);

    let currentLastId = lastId;

    try {
      while (true) {
        addLog(`Fetching batch starting after: ${currentLastId || 'First Record'}...`);
        const url = `/api/migrate-firebase?limit=${batchLimit}${currentLastId ? `&startAfterId=${currentLastId}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'API returned failure status');
        }

        const count = data.count || 0;
        const newlyMigrated = data.migratedCount || 0;
        const currentLast = data.lastId || null;

        if (count === 0) {
          addLog('🎉 Firebase migration complete! No more signatures left in Firebase.');
          setStatus('completed');
          setIsMigrating(false);
          break;
        }

        setTotalFetched(prev => prev + count);
        setTotalNew(prev => prev + newlyMigrated);
        setLastId(currentLast);
        currentLastId = currentLast;

        addLog(`✅ Batch Success: Fetched ${count} signatures. Newly inserted: ${newlyMigrated}. Duplicates skipped: ${count - newlyMigrated}.`);

        // Give the database / Vercel some breathing room
        await new Promise(r => setTimeout(r, 600));

        if (!currentLast) {
          addLog('🎉 Firebase migration complete! Reached the end of the Firebase collection.');
          setStatus('completed');
          setIsMigrating(false);
          break;
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
      setStatus('error');
      setIsMigrating(false);
      addLog(`❌ Critical Error: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 my-8 bg-stone-900 rounded-2xl border border-stone-800 shadow-xl">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-800">
        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
          <Database className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-amber-500">Firebase to PostgreSQL Database Migration</h1>
          <p className="text-sm text-stone-400">Migrate and merge all live signatures into your high-performance PostgreSQL database</p>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-400">அறிவுறுத்தல் (Tamil Translation Note)</p>
          <p className="text-stone-300 mt-1">
            மச்சான், Firebase இலவச வரம்பு (Daily Quota) முடிந்திருந்தாலும் கவலைப்பட வேண்டாம்!
            நமது சர்வரில் உள்ள **29,201 கையொப்பங்களின் பேக்கப்பை (Local Backup)** இப்போதே நேரடியாகவும் அதிவேகமாகவும் PostgreSQL-க்கு மாற்றிவிடலாம்! 
            அதன்பின் ஃபயர்பேஸ் லிமிட் ரீசெட் ஆனதும் மீதமுள்ள லைவ் கையொப்பங்களையும் இதனுடன் இணைத்துக்கொள்ளலாம்!
          </p>
        </div>
      </div>

      {/* Migration Method Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => { setMigrationType('local'); setTotalFetched(0); setTotalNew(0); setStatus('idle'); }}
          disabled={isMigrating}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${migrationType === 'local' ? 'border-amber-500 bg-amber-500/5' : 'border-stone-800 bg-stone-950/40 hover:bg-stone-900'}`}
        >
          <div>
            <span className="text-xs text-amber-500 font-bold uppercase tracking-wider block mb-1">Method A (Instant & Safe)</span>
            <span className="text-sm font-bold text-stone-200">Local Backup File (29,201 signatures)</span>
            <p className="text-xs text-stone-400 mt-1">
              Bypasses Firebase completely. Instantly imports 29,201 signatures from backup in seconds!
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setMigrationType('firebase'); setTotalFetched(0); setTotalNew(0); setStatus('idle'); }}
          disabled={isMigrating}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${migrationType === 'firebase' ? 'border-amber-500 bg-amber-500/5' : 'border-stone-800 bg-stone-950/40 hover:bg-stone-900'}`}
        >
          <div>
            <span className="text-xs text-amber-500 font-bold uppercase tracking-wider block mb-1">Method B (Live Stream)</span>
            <span className="text-sm font-bold text-stone-200">Firebase Live Database</span>
            <p className="text-xs text-stone-400 mt-1">
              Connects to Live Firebase Firestore. Best to run once the daily quota resets or is active.
            </p>
          </div>
        </button>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
          <p className="text-xs text-stone-500 uppercase tracking-wider">Processed Total</p>
          <p className="text-2xl font-extrabold mt-1 text-stone-200">{totalFetched.toLocaleString()}</p>
        </div>
        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
          <p className="text-xs text-amber-500 uppercase tracking-wider">Newly Migrated to Postgres</p>
          <p className="text-2xl font-extrabold mt-1 text-amber-500">{totalNew.toLocaleString()}</p>
        </div>
        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
          <p className="text-xs text-emerald-500 uppercase tracking-wider">Duplicates Skipped / Verified</p>
          <p className="text-2xl font-extrabold mt-1 text-emerald-500">{(totalFetched - totalNew).toLocaleString()}</p>
        </div>
      </div>

      {/* Batch limits and Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="block text-xs text-stone-400 mb-1">Batch Limit (Signatures per call)</label>
          <select 
            value={batchLimit} 
            onChange={(e) => setBatchLimit(parseInt(e.target.value))}
            disabled={isMigrating}
            className="bg-stone-950 text-stone-200 border border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="200">200 signatures (Slower, Safer)</option>
            <option value="500">500 signatures (Recommended)</option>
            <option value="1000">1000 signatures (Lightning Fast)</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]" />

        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/'}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </button>
          
          <button
            onClick={handleStartMigration}
            disabled={isMigrating || status === 'completed'}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 transition disabled:opacity-50 shadow-md"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start {migrationType === 'local' ? 'Backup' : 'Live'} Migration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {status === 'running' && (
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-stone-400 mb-1">
            <span>Processing Live Stream...</span>
            <span className="animate-pulse text-amber-500">● Live Progress</span>
          </div>
          <div className="w-full bg-stone-950 h-3 rounded-full overflow-hidden border border-stone-800">
            <div className="bg-amber-500 h-full animate-pulse transition-all duration-300" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {/* Completion Screen */}
      {status === 'completed' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 flex gap-3 items-center">
          <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-400">Migration Successfully Finished!</p>
            <p className="text-xs text-stone-300 mt-0.5">
              All records have been parsed, migrated, and merged perfectly. Your live website is now 100% full-stack!
            </p>
          </div>
        </div>
      )}

      {/* Error Panel */}
      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 flex gap-3 items-center">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-400">Migration Stopped Due to Error</p>
            <p className="text-xs text-stone-300 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 📥 One-Click Full Database Backup (Admin Section) */}
      <div className="bg-stone-950 p-6 rounded-xl border border-stone-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-200">One-Click Client Export Tool (75,000+ Signatures)</h3>
              <p className="text-xs text-stone-400">Download the entire database including all unmasked phone numbers and NICs for official submission.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold self-start sm:self-auto">
            Secure Admin Only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/api/export-all?secret=sam_admin_2026&format=csv"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-extrabold text-sm transition shadow-lg shadow-emerald-600/10 active:scale-95 text-center"
          >
            <FileText className="w-4 h-4" />
            Download Complete CSV (Excel Compatible)
          </a>
          <a
            href="/api/export-all?secret=sam_admin_2026&format=json"
            target="_blank"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-200 font-bold text-sm transition text-center"
          >
            <Terminal className="w-4 h-4" />
            View Complete JSON Backup
          </a>
        </div>
        <div className="mt-3 bg-stone-900/40 p-3 rounded-lg border border-stone-800/60 text-center">
          <p className="text-[11px] text-stone-400">
            ⚠️ <strong>Security Notice:</strong> These files contain unmasked, confidential raw signers data. Keep this page URL private and share only with authorized personnel.
          </p>
        </div>
      </div>

      {/* Real-time Logs Console */}
      <div className="bg-stone-950 rounded-xl p-4 border border-stone-800">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-900">
          <Terminal className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-500 tracking-wider uppercase">Console Logs Output</span>
        </div>
        <div className="font-mono text-[11px] leading-relaxed text-stone-300 h-64 overflow-y-auto flex flex-col gap-1 select-text scrollbar-thin">
          {logs.map((log, i) => (
            <div key={i} className={`p-1 rounded ${log.includes('❌') ? 'bg-red-500/5 text-red-400' : log.includes('✅') ? 'text-emerald-400' : log.includes('🎉') ? 'bg-amber-500/10 text-amber-400 font-bold' : ''}`}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>('si');
  const [stats, setStats] = useState<PetitionStats>(() => getPetitionStats());
  const [signatures, setSignatures] = useState<Signature[]>(() => getStoredSignatures());
  const [isMigratePage, setIsMigratePage] = useState(false);

  useEffect(() => {
    if (window.location.search === '?migrate=true' || window.location.hash === '#migrate') {
      setIsMigratePage(true);
    }
  }, []);

  const [activeCertSignature, setActiveCertSignature] = useState<Signature | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAllSignaturesModal, setShowAllSignaturesModal] = useState(false);
  const [selectedDistrictForModal, setSelectedDistrictForModal] = useState<string>('all');

  // Real-time Firestore synchronization
  useEffect(() => {
    const unsubscribe = subscribeToSignatures((updatedSignatures) => {
      setSignatures(updatedSignatures);
      setStats(calculateStats(updatedSignatures));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync state whenever signatures change manually
  const refreshData = () => {
    const current = getStoredSignatures();
    setSignatures(current);
    setStats(calculateStats(current));
  };

  const handleSignSuccess = (newSig: Signature) => {
    refreshData();
    setActiveCertSignature(newSig);
  };

  const handleOpenAllSignatures = (districtCode: string = 'all') => {
    setSelectedDistrictForModal(districtCode);
    setShowAllSignaturesModal(true);
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

  if (isMigratePage) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white p-4">
        <MigrationDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white pb-16 md:pb-0">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 py-1.5 px-4 text-center text-stone-950 font-bold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2">
        <span className="animate-pulse">●</span>
        <span>
          {language === 'si'
            ? 'පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන් වෙනුවෙන් ජනාධිපති සමාව ඉල්ලා අත්සන් ලක්ෂ 50 ක මහජන පෙත්සම'
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
        onAllSignaturesClick={() => handleOpenAllSignatures('all')}
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
          onViewAll={(district) => handleOpenAllSignatures(district || 'all')}
          onSignClick={scrollToSign}
          onSelectSignature={(sig) => setActiveCertSignature(sig)}
        />

        {/* Islandwide District Breakdown */}
        <DistrictDistribution
          language={language}
          districtStats={stats.districtStats}
          onSelectDistrict={(districtCode) => handleOpenAllSignatures(districtCode)}
        />
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onShareClick={() => setShowShareModal(true)}
        onSignClick={scrollToSign}
      />

      {/* All Signatures Directory Modal (50 per page with search and district filter) */}
      {showAllSignaturesModal && (
        <AllSignaturesModal
          language={language}
          initialDistrict={selectedDistrictForModal}
          signatures={signatures}
          onClose={() => setShowAllSignaturesModal(false)}
          onSelectSignature={(sig) => {
            setShowAllSignaturesModal(false);
            setActiveCertSignature(sig);
          }}
          onSignClick={scrollToSign}
        />
      )}

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

      {/* Mobile Sticky Quick-Action Bar */}
      <MobileBottomBar
        language={language}
        onSignClick={scrollToSign}
        onAllSignaturesClick={() => handleOpenAllSignatures('all')}
        onVerifyClick={() => setShowVerifyModal(true)}
        onShareClick={() => setShowShareModal(true)}
        totalSignatures={stats.currentCount}
      />
    </div>
  );
}
