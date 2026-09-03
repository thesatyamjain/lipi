import React, { useRef, useState } from 'react';
import { IconUpload, IconDocument, IconShieldCheck, IconCocktail, IconBookOpen } from '../common/Icons';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onLoadDemo: () => void;
  onOpenGuide?: () => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  onLoadDemo,
  onOpenGuide,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp|tiff?)$/i)) {
      alert('Please select a valid PDF or image file (JPG, PNG, WebP, TIFF).');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Pan-Bharatiya Language Badge */}
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#131622] border border-[#232a3c] text-xs text-[#cbd5e1] shadow-sm">
          <span className="text-xs">🇮🇳</span>
          <span className="font-semibold text-white">Full Pan-Bharatiya Engine</span>
          <span className="text-[#64748b]">•</span>
          <span className="text-[#c59b27] font-mono text-[11px]">All 22 Official Languages Supported</span>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Client-Side Document OCR with Strict Page Fidelity
        </h1>
        <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
          Process multi-page scanned documents in parallel across your CPU cores with high-fidelity Indic script detection. Input Page N strictly equals Output Word Page N.
        </p>

        {/* Indic Script Chips */}
        <div className="flex flex-wrap justify-center gap-1.5 pt-1 max-w-xl mx-auto">
          {['हिन्दी', 'தமிழ்', 'বাংলা', 'తెలుగు', 'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം', 'ਪੰਜਾਬੀ', 'ଓଡ଼ିଆ', 'اردو', 'অসমীয়া', 'संस्कृतम्', 'English'].map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded bg-[#11141e] border border-[#1f2637] text-[11px] font-medium text-[#94a3b8]"
            >
              {s}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded bg-[#11141e] border border-[#1f2637] text-[10px] font-mono text-[#c59b27]">
            +9 more
          </span>
        </div>
      </div>

      {/* Drop Surface */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all duration-200 cursor-pointer overflow-hidden ${
          isDragOver
            ? 'border-[#c59b27] bg-[#c59b27]/5 shadow-xl shadow-[#c59b27]/10 scale-[1.008]'
            : 'border-[#242b3d] bg-[#0d1017] hover:border-[#38435d] hover:bg-[#10141d]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp,image/tiff"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-[#171b26] border border-[#2b3347] flex items-center justify-center text-[#c59b27] shadow-lg">
            <IconUpload className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-white tracking-tight">
              Drag and drop your PDF or scanned images here
            </p>
            <p className="text-xs text-[#8e98a8]">
              Supports PDF (up to 300+ pages), JPG, PNG, WebP, or multi-page TIFF
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-[#181d2a] border border-[#283147] text-xs font-semibold text-[#e2e8f0] hover:bg-[#202738] hover:border-[#3c4866] transition-all shadow-sm">
              Select Document from Computer
            </span>
          </div>
        </div>

        {/* Feature Highlights beneath */}
        <div className="mt-8 pt-6 border-t border-[#1a202d] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-[#161a24] text-[#c59b27] mt-0.5">
              <IconDocument className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-white">1:1 Page Guarantee</div>
              <div className="text-[11px] text-[#78859b]">No reflow spillover on Word export</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-[#161a24] text-[#4ade80] mt-0.5">
              <IconShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-white">Zero Server Upload</div>
              <div className="text-[11px] text-[#78859b]">Processed 100% inside your browser</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-[#161a24] text-[#c59b27] mt-0.5">
              <IconCocktail className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-white">Cocktail Engine</div>
              <div className="text-[11px] text-[#78859b]">Tesseract WASM + Gemini Vision AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Loader Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-[#0f121a] border border-[#1e2434] gap-4">
        <div className="text-left">
          <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
            <span>No document on hand?</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#c59b27]/20 text-[#c59b27] border border-[#c59b27]/30">
              Interactive Demo
            </span>
          </div>
          <p className="text-[11px] text-[#8e98a8]">
            Test the parallel engine and Hindi + English script detection with our verified 3-page specimen.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenGuide && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGuide();
              }}
              className="px-3.5 py-2 rounded-lg bg-[#131622] border border-[#232b3d] text-xs font-semibold text-[#cbd5e1] hover:text-white hover:border-[#c59b27]/40 hover:bg-[#191e2e] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <IconBookOpen className="w-3.5 h-3.5 text-[#c59b27]" />
              <span>User Guide</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoadDemo();
            }}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-[#181d2a] border border-[#2b354c] text-xs font-semibold text-[#f1f5f9] hover:bg-[#c59b27] hover:text-black hover:border-[#c59b27] transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            Load 3-Page Bilingual Specimen
          </button>
        </div>
      </div>
    </div>
  );
};
