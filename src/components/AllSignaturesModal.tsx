import React, { useState, useMemo } from 'react';
import { Language, Signature } from '../types';
import { DISTRICTS, TRANSLATIONS } from '../data/translations';
import { getStoredSignatures, maskNic, exportSignaturesToCsv } from '../data/petitionStore';
import { 
  X, 
  Search, 
  MapPin, 
  Calendar, 
  Download, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Users,
  PenTool,
  Clock
} from 'lucide-react';

interface AllSignaturesModalProps {
  language: Language;
  initialDistrict?: string;
  signatures?: Signature[];
  onClose: () => void;
  onSelectSignature: (sig: Signature) => void;
  onSignClick: () => void;
}

const PAGE_SIZE = 50;

export const AllSignaturesModal: React.FC<AllSignaturesModalProps> = ({
  language,
  initialDistrict = 'all',
  signatures: propSignatures,
  onClose,
  onSelectSignature,
  onSignClick
}) => {
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const allSignatures = useMemo(() => {
    return propSignatures !== undefined ? propSignatures : getStoredSignatures();
  }, [propSignatures]);

  const getDistrictName = (code: string) => {
    const found = DISTRICTS.find(d => d.value === code);
    return found ? (language === 'si' ? found.si : language === 'ta' ? found.ta : found.en) : code;
  };

  // Filter signatures based on district and search
  const filtered = useMemo(() => {
    let result = allSignatures;

    if (district !== 'all') {
      result = result.filter(s => s.district === district);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(s => 
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.nic.toLowerCase().includes(q) ||
        (s.comment && s.comment.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allSignatures, district, searchQuery]);

  // Reset to page 1 whenever filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const startRecord = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md">
      <div 
        id="all-signatures-modal"
        className="relative w-full max-w-5xl h-[92vh] max-h-[920px] bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 bg-stone-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-stone-100 font-sinhala-display">
                  {language === 'si' 
                    ? 'සියලු අත්සන් ලේඛනය' 
                    : language === 'ta' 
                    ? 'அனைத்து கையொப்பப் பட்டியல்' 
                    : 'All Signatures Directory'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                  {filtered.length} {language === 'si' ? 'අත්සන්' : 'signed'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {language === 'si'
                  ? 'ජනාධිපති සමාව ඉල්ලා දිවයින පුරා පුරවැසියන් තැබූ නිල අත්සන්'
                  : language === 'ta'
                  ? 'நாடளாவிய ரீதியில் பதியப்பட்ட உத்தியோகபூர்வ கையொப்பங்கள்'
                  : 'Official record of citizens supporting the presidential pardon'}
              </p>
            </div>
          </div>

          {/* Action buttons (CSV Download & Close) */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {filtered.length > 0 && (
              <button
                onClick={exportSignaturesToCsv}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition border border-stone-700"
                title="Download CSV / Excel list"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">CSV බාගත කරන්න</span>
                <span className="sm:hidden">CSV</span>
              </button>
            )}

            <button
              onClick={onClose}
              id="close-all-signatures-btn"
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/90 flex flex-col sm:flex-row gap-3 shrink-0">
          {/* District selector */}
          <div className="w-full sm:w-64">
            <label className="block text-[11px] font-semibold text-stone-400 mb-1">
              {language === 'si' ? 'දිස්ත්‍රික්කය තෝරන්න:' : language === 'ta' ? 'மாவட்டம் தெரிவு:' : 'Select District:'}
            </label>
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">
                {language === 'si' ? 'සියලු දිස්ත්‍රික්ක (All Districts)' : language === 'ta' ? 'அனைத்து மாவட்டங்கள் (All)' : 'All Districts'}
              </option>
              {DISTRICTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {language === 'si' ? d.si : language === 'ta' ? d.ta : d.en}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-stone-400 mb-1">
              {language === 'si' ? 'නම හෝ අංකය අනුව සොයන්න:' : language === 'ta' ? 'பெயர் அல்லது இலக்கம் தேடல்:' : 'Search by Name or ID:'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={language === 'si' ? 'නම, හැඳුනුම්පත් අංකය, පෙත්සම් ID සොයන්න...' : 'Search name, NIC, petition ID...'}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Table / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filtered.length > 0 ? (
            <div className="space-y-2.5">
              {/* Pagination info bar */}
              <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800/80">
                <span>
                  {language === 'si' 
                    ? `පෙන්වන්නේ ${startRecord}–${endRecord} (මුළු අත්සන් ${filtered.length})` 
                    : language === 'ta'
                    ? `${startRecord}–${endRecord} காட்டப்படுகிறது (மொத்தம் ${filtered.length})`
                    : `Showing ${startRecord}–${endRecord} of ${filtered.length} signatures`}
                </span>
                <span className="font-mono text-amber-400/80">
                  පිටුව {currentPage} / {totalPages}
                </span>
              </div>

              {/* Grid / List of 50 items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paginatedItems.map((sig, idx) => {
                  const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <div
                      key={sig.id}
                      onClick={() => onSelectSignature(sig)}
                      className="p-3.5 sm:p-4 rounded-2xl bg-stone-950/80 border border-stone-800/90 hover:border-amber-500/60 hover:bg-stone-950 transition flex items-start justify-between gap-3 cursor-pointer group shadow-sm"
                      title="Click to view official certificate"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Number Index Badge */}
                        <div className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-xs font-mono text-amber-400 font-bold shrink-0 group-hover:border-amber-500/40">
                          #{globalIdx}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-stone-200 text-sm truncate group-hover:text-amber-300 transition">
                              {sig.fullName}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>සත්‍යාපිත</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-stone-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500/80" />
                              {getDistrictName(sig.district)}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-stone-500">
                              NIC: {maskNic(sig.nic)}
                            </span>
                          </div>

                          {sig.comment && (
                            <p className="text-xs text-stone-300 italic line-clamp-1 bg-stone-900/70 px-2 py-1 rounded border border-stone-800/40">
                              "{sig.comment}"
                            </p>
                          )}

                          <div className="text-[10px] text-stone-500 flex items-center gap-1 pt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{new Date(sig.createdAt).toLocaleDateString()} {new Date(sig.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-mono text-stone-600 ml-1">({sig.id})</span>
                          </div>
                        </div>
                      </div>

                      {/* View Certificate CTA */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSignature(sig);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 group-hover:border-amber-500/40 text-amber-400 text-xs font-medium hover:bg-amber-950/40 transition shrink-0 self-center"
                      >
                        {language === 'si' ? 'සහතිකය' : language === 'ta' ? 'சான்றிதழ்' : 'Certificate'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Users className="w-12 h-12 text-stone-600" />
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-stone-300">
                  {searchQuery || district !== 'all' 
                    ? 'මෙම සෙවුමට අදාළ අත්සන් හමු නොවීය' 
                    : 'තවමත් සජීවී අත්සන් නොමැත'}
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {searchQuery || district !== 'all'
                    ? 'කරුණාකර වෙනත් දිස්ත්‍රික්කයක් තෝරන්න හෝ සෙවුම් වචනය වෙනස් කරන්න.'
                    : 'පූජ්‍ය ගලගොඩඅත්තේ ඥානසාර හිමියන්ගේ නිදහස වෙනුවෙන් පළමු අත්සන තබා පෙත්සම ආරම්භ කරන්න!'}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onSignClick();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <PenTool className="w-4 h-4" />
                <span>{language === 'si' ? 'දැන්ම අත්සන් කරන්න' : language === 'ta' ? 'இப்போதே கையொப்பமிடுக' : 'Sign Petition Now'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Pagination Footer (50 per page) */}
        {totalPages > 1 && (
          <div className="p-2.5 sm:p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-2 shrink-0">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition shrink-0 ${
                currentPage <= 1
                  ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                  : 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{language === 'si' ? 'පෙර' : language === 'ta' ? 'முந்தையது' : 'Prev'}</span>
            </button>

            {/* Mobile compact page indicator */}
            <div className="sm:hidden text-xs text-stone-400 font-mono text-center">
              <span className="text-amber-400 font-bold">{currentPage}</span> / {totalPages}
            </div>

            {/* Desktop / tablet Page number indicators */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto max-w-[320px] px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, index, array) => {
                  const showEllipsis = index > 0 && p - array[index - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="text-stone-600 px-1">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                          p === currentPage
                            ? 'bg-amber-600 text-stone-950'
                            : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition shrink-0 ${
                currentPage >= totalPages
                  ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                  : 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700'
              }`}
            >
              <span>{language === 'si' ? 'මීළඟ' : language === 'ta' ? 'அடுத்தது' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
