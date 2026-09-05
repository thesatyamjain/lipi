import React, { useState, useRef } from 'react';
import { DocumentMode } from '../../types';
import * as pdfjsLib from 'pdfjs-dist';
import { IconUpload, IconDocument, IconCpu, IconDualEngine } from '../common/Icons';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onLoadDemo: () => void;
  isProcessing: boolean;
  documentMode?: DocumentMode;
  onDocumentModeChange?: (mode: DocumentMode) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  onLoadDemo,
  isProcessing,
  documentMode = 'printed',
  onDocumentModeChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preflightData, setPreflightData] = useState<{
    file: File;
    pageCount: number;
    dpi: number;
    threads: number;
    estSec: number;
  } | null>(null);
  const [isPreflighting, setIsPreflighting] = useState(false);
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
      validateAndInspect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndInspect(e.target.files[0]);
    }
  };

  const validateAndInspect = async (file: File) => {
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

    const threads = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

    // Fast pre-flight inspection (PRD §7.1)
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setIsPreflighting(true);
      try {
        const buffer = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        const pageCount = doc.numPages;
        const estSec = Math.max(2, Math.round((pageCount * 2.2) / Math.max(1, threads - 1)));
        setPreflightData({
          file,
          pageCount,
          dpi: 200,
          threads,
          estSec,
        });
      } catch (err) {
        // Fallback: direct pass
        onFileSelect(file);
      } finally {
        setIsPreflighting(false);
      }
    } else {
      // Image or TIFF
      setPreflightData({
        file,
        pageCount: 1,
        dpi: 300,
        threads,
        estSec: 2,
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Hero Headline */}
      <div className="text-center space-y-2 mb-6 sm:mb-7">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Document OCR with Strict Page Fidelity
        </h1>
        <p className="text-xs sm:text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
          High-precision multi-page Indic script recognition. Page boundaries are strictly preserved 1:1 on export.
        </p>

        {/* Indic Script Chips */}
        <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 pt-1 max-w-xl mx-auto">
          {['हिन्दी', 'தமிழ்', 'বাংলা', 'తెలుగు', 'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം', 'ਪੰਜਾਬੀ', 'ଓଡ଼ିଆ', 'اردو', 'অসমীয়া', 'संस्कृतम्', 'English'].map((s) => (
            <span
              key={s}
              className="px-1.5 sm:px-2 py-0.5 rounded bg-[#11141e] border border-[#1f2637] text-[10px] sm:text-[11px] font-medium text-[#94a3b8]"
            >
              {s}
            </span>
          ))}
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#11141e] border border-[#1f2637] text-[9px] sm:text-[10px] font-mono text-[#c59b27]">
            +9 more
          </span>
        </div>

        {/* Document Mode Selector (PRD §2.2 / §7.1) */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-1.5 sm:gap-2 pt-2.5 sm:pt-3">
          <span className="text-[11px] sm:text-xs text-[#8e98a8] font-mono">Mode:</span>
          <div className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto rounded-lg bg-[#11141e] border border-[#202739] p-0.5 text-xs font-mono">
            {[
              { id: 'printed', label: 'Typeset Print', shortLabel: 'Typeset' },
              { id: 'handwritten', label: 'Handwritten / Manuscripts (हस्तलिखित)', shortLabel: 'Manuscript' },
              { id: 'mixed', label: 'Mixed Forms', shortLabel: 'Mixed' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onDocumentModeChange?.(m.id as DocumentMode)}
                className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md transition-all cursor-pointer text-center truncate ${
                  documentMode === m.id
                    ? 'bg-[#c59b27] text-black font-semibold shadow-sm'
                    : 'text-[#8e98a8] hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">{m.label}</span>
                <span className="sm:hidden">{m.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drop Surface */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-14 text-center transition-all duration-200 cursor-pointer overflow-hidden ${
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

        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#171b26] border border-[#2b3347] flex items-center justify-center text-[#c59b27] shadow-lg">
            <IconUpload className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Drag and drop your PDF or scanned images here
            </p>
            <p className="text-[11px] sm:text-xs text-[#8e98a8]">
              Supports PDF (up to 300+ pages), JPG, PNG, WebP, or multi-page TIFF
            </p>
          </div>

          <div className="pt-1 sm:pt-2 w-full sm:w-auto">
            <span className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-[#181d2a] border border-[#283147] text-xs font-semibold text-[#e2e8f0] hover:bg-[#202738] hover:border-[#3c4866] transition-all shadow-sm">
              Select Document from Device
            </span>
          </div>
        </div>

        {/* Feature Highlights beneath */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#1a202d] grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-[#161a24] text-[#c59b27] mt-0.5 shrink-0">
              <IconDocument className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-white">1:1 Page Fidelity</div>
              <div className="text-[11px] text-[#78859b]">Strict per-page output boundary mapping</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-[#161a24] text-[#4ade80] mt-0.5 shrink-0">
              <IconCpu className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-white">Parallel Concurrency</div>
              <div className="text-[11px] text-[#78859b]">Multi-threaded CPU worker queue</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-[#161a24] text-[#c59b27] mt-0.5 shrink-0">
              <IconDualEngine className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-white">Dual-Engine Architecture</div>
              <div className="text-[11px] text-[#78859b]">WASM baseline with AI Vision refinement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Loader Bar */}
      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#0f121a] border border-[#1e2434] gap-3 sm:gap-4">
        <div className="text-left w-full sm:w-auto">
          <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
            <span>No document on hand?</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#c59b27]/20 text-[#c59b27] border border-[#c59b27]/30">
              Interactive Demo
            </span>
          </div>
          <p className="text-[11px] text-[#8e98a8] mt-0.5">
            Test the parallel engine and Hindi + English script detection with our verified 3-page specimen.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoadDemo();
            }}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-[#181d2a] border border-[#2b354c] text-xs font-semibold text-[#f1f5f9] hover:bg-[#c59b27] hover:text-black hover:border-[#c59b27] transition-all cursor-pointer shadow-md disabled:opacity-50 text-center"
          >
            Load 3-Page Bilingual Specimen
          </button>
        </div>
      </div>

      {/* Pre-Flight Inspection Loading Overlay */}
      {isPreflighting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0e111a] border border-[#232b3d] rounded-xl p-5 flex items-center gap-3 text-xs font-mono text-white shadow-2xl">
            <div className="w-5 h-5 border-2 border-[#c59b27] border-t-transparent rounded-full animate-spin" />
            <span>Analyzing document structure &amp; page telemetry...</span>
          </div>
        </div>
      )}

      {/* Pre-Flight Telemetry Inspector Modal (PRD §7.1) */}
      {preflightData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0e111a] border border-[#232b3d] rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1f2638] pb-3">
              <div className="flex items-center gap-2">
                <IconDocument className="w-4 h-4 text-[#c59b27]" />
                <h3 className="text-xs sm:text-sm font-semibold text-white font-mono">Pre-Flight Document Telemetry</h3>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-[#c59b27]/20 text-[#f6d26d] border border-[#c59b27]/30">
                PRD §7.1 Telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#141724] border border-[#1f2638] space-y-1">
                <div className="text-[10px] text-[#8e98a8]">Document Name</div>
                <div className="text-white truncate font-medium" title={preflightData.file.name}>
                  {preflightData.file.name}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#141724] border border-[#1f2638] space-y-1">
                <div className="text-[10px] text-[#8e98a8]">File Size &amp; Format</div>
                <div className="text-white font-medium">
                  {(preflightData.file.size / (1024 * 1024)).toFixed(2)} MB &bull; {preflightData.file.type || 'PDF'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#141724] border border-[#1f2638] space-y-1">
                <div className="text-[10px] text-[#8e98a8]">Page Count &amp; Resolution</div>
                <div className="text-white font-medium">
                  {preflightData.pageCount} page{preflightData.pageCount > 1 ? 's' : ''} &bull; ~{preflightData.dpi} DPI
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#141724] border border-[#1f2638] space-y-1">
                <div className="text-[10px] text-[#8e98a8]">Hardware Concurrency &amp; ETA</div>
                <div className="text-[#4ade80] font-medium">
                  {preflightData.threads} Cores &bull; ~{preflightData.estSec}s ETA
                </div>
              </div>
            </div>

            {preflightData.pageCount >= 300 && (
              <div className="p-2.5 rounded-lg bg-[#c59b27]/10 border border-[#c59b27]/30 text-[11px] text-[#f6d26d] leading-relaxed">
                <strong>Large document notice (300+ pages):</strong> Chunked streaming pipeline active to prevent memory bloat and maintain &lt;250 MB browser RAM.
              </div>
            )}

            {/* Document Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#94a3b8] font-mono">Select Document Processing Mode</label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs font-mono">
                {[
                  { id: 'printed', label: 'Typeset Print', shortLabel: 'Typeset' },
                  { id: 'handwritten', label: 'Handwritten', shortLabel: 'Manuscript' },
                  { id: 'mixed', label: 'Mixed Forms', shortLabel: 'Mixed' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onDocumentModeChange?.(m.id as DocumentMode)}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer truncate ${
                      documentMode === m.id
                        ? 'bg-[#c59b27]/20 border-[#c59b27] text-white font-semibold'
                        : 'bg-[#141724] border-[#22293b] text-[#8e98a8] hover:text-white'
                    }`}
                  >
                    <span className="hidden sm:inline">{m.label}</span>
                    <span className="sm:hidden">{m.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreflightData(null)}
                className="px-4 py-2 rounded-lg border border-[#283147] text-xs font-mono text-[#94a3b8] hover:text-white transition-colors cursor-pointer text-center"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = preflightData.file;
                  setPreflightData(null);
                  onFileSelect(f);
                }}
                className="px-5 py-2 rounded-lg bg-[#c59b27] text-black font-semibold text-xs font-mono hover:bg-[#d8ab2e] transition-all cursor-pointer shadow-lg text-center"
              >
                Start High-Fidelity OCR &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
