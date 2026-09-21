import React, { useRef, useState, useEffect } from 'react';
import { Pen, Type, RotateCcw, Check } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface SignaturePadProps {
  language: Language;
  onSignatureChange: (dataUrl: string) => void;
  signerName: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  language,
  onSignatureChange,
  signerName
}) => {
  const t = TRANSLATIONS[language];
  const [tab, setTab] = useState<'draw' | 'type'>('draw');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState(signerName || '');
  const [selectedFont, setSelectedFont] = useState<'cursive' | 'serif' | 'sans-serif'>('cursive');

  // Sync signerName if changed
  useEffect(() => {
    if (signerName && !typedName) {
      setTypedName(signerName);
    }
  }, [signerName]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial clear & background
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#f59e0b'; // Amber 500
  }, [tab]);

  // When switching to typed or typing changes, generate canvas data
  useEffect(() => {
    if (tab === 'type' && typedName.trim()) {
      const offscreen = document.createElement('canvas');
      offscreen.width = 400;
      offscreen.height = 160;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1c1917'; // stone-900 background
        ctx.fillRect(0, 0, 400, 160);
        ctx.fillStyle = '#f59e0b'; // amber color
        ctx.font = selectedFont === 'cursive' ? 'italic 34px "Brush Script MT", cursive, sans-serif' : '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 200, 80);

        // Underline stroke
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(80, 110);
        ctx.lineTo(320, 110);
        ctx.stroke();

        const dataUrl = offscreen.toDataURL('image/png');
        onSignatureChange(dataUrl);
      }
    }
  }, [tab, typedName, selectedFont]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ('touches' in e) {
      // Prevent scrolling when drawing on touch screens
      if (e.cancelable) e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureChange('');
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle tabs */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
          <span>{t.signatureLabel}</span>
          <span className="text-amber-500">*</span>
        </label>

        <div className="flex bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab('draw')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 font-medium ${
              tab === 'draw'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Pen className="w-3 h-3" />
            <span>{t.signatureDrawTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('type')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 font-medium ${
              tab === 'type'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Type className="w-3 h-3" />
            <span>{t.signatureTypeTab}</span>
          </button>
        </div>
      </div>

      {tab === 'draw' ? (
        <div className="space-y-2">
          <div className="relative rounded-xl border border-stone-700 bg-stone-950 overflow-hidden shadow-inner group">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-stone-600 text-xs">
                {t.drawInstruction}
              </div>
            )}
            {hasDrawn && (
              <button
                type="button"
                onClick={clearCanvas}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-stone-800/90 text-stone-300 hover:text-white border border-stone-700 text-xs flex items-center gap-1 transition shadow-sm"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.clearSig}</span>
              </button>
            )}
          </div>
          <div className="flex justify-between text-[11px] text-stone-500">
            <span>{t.drawInstruction}</span>
            {hasDrawn && <span className="text-emerald-400 font-medium">✓ අත්සන සටහන් විය</span>}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={signerName || t.namePlaceholder}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition"
          />
          {typedName.trim() && (
            <div className="p-4 rounded-xl bg-stone-950 border border-amber-900/40 text-center">
              <div className="text-xs text-stone-500 mb-1">ඩිජිටල් අත්සන් පෙරදසුන (Signature Preview):</div>
              <div className="text-2xl sm:text-3xl text-amber-400 italic font-serif py-2 border-b border-amber-800/40 inline-block px-8">
                {typedName}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
