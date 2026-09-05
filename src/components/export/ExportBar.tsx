import React, { useState } from 'react';
import { PageData, JobConfig, DocumentJob } from '../../types';
import { generateStrictFidelityDocx } from '../../core/export/docxExporter';
import { generateStandaloneHtmlViewer } from '../../core/export/htmlViewerExporter';
import { generateCanonicalStructuredJson, generateAuditProvenanceManifest } from '../../core/export/jsonExporter';
import saveAs from 'file-saver';
import { IconDownload, IconDocument, IconCopy, IconCheck } from '../common/Icons';
import { Footer } from '../common/Footer';

interface ExportBarProps {
  fileName: string;
  pages: PageData[];
  config: JobConfig;
  job?: DocumentJob | null;
  onReset: () => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  fileName,
  pages,
  config,
  job,
  onReset,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);


  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      const blob = await generateStrictFidelityDocx(pages, {
        fileName,
        autoFit: config.autoFitDocx,
      });
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      saveAs(blob, `${cleanName}_KALON_StrictFidelity.docx`);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      alert('Failed to generate Word document.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportHtml = () => {
    try {
      const blob = generateStandaloneHtmlViewer(fileName, pages);
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      saveAs(blob, `${cleanName}_SinglePageViewer.html`);
    } catch (err) {
      console.error('Failed to export HTML viewer:', err);
      alert('Failed to generate HTML viewer.');
    }
  };

  const handleExportTxt = () => {
    const fullText = pages
      .map((p) => `==================== PAGE ${p.pageNumber} ====================\n\n${p.text}`)
      .join('\n\n\n');
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const cleanName = fileName.replace(/\.[^/.]+$/, '');
    saveAs(blob, `${cleanName}_Transcription.txt`);
  };

  const handleExportMd = () => {
    const mdText = pages
      .map((p) => `## Page ${p.pageNumber}\n\n${p.text}`)
      .join('\n\n---\n\n');
    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
    const cleanName = fileName.replace(/\.[^/.]+$/, '');
    saveAs(blob, `${cleanName}_Transcription.md`);
  };

  const handleExportJson = () => {
    try {
      const activeJob: DocumentJob = job || {
        id: `job_${Date.now()}`,
        fileName,
        fileSize: 0,
        fileType: 'application/pdf',
        totalPages: pages.length,
        pages,
        status: 'completed',
      };
      const blob = generateCanonicalStructuredJson(activeJob, config.documentMode);
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      saveAs(blob, `${cleanName}_Canonical_Structure.json`);
    } catch (err) {
      console.error('Failed to export Canonical JSON:', err);
      alert('Failed to generate Canonical Structured JSON.');
    }
  };

  const handleExportAudit = () => {
    try {
      const activeJob: DocumentJob = job || {
        id: `job_${Date.now()}`,
        fileName,
        fileSize: 0,
        fileType: 'application/pdf',
        totalPages: pages.length,
        pages,
        status: 'completed',
      };
      const blob = generateAuditProvenanceManifest(activeJob, config);
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      saveAs(blob, `${cleanName}_Audit_Manifest.json`);
    } catch (err) {
      console.error('Failed to export Audit Manifest:', err);
      alert('Failed to generate Audit Manifest.');
    }
  };

  const handleCopyAll = () => {
    const fullText = pages
      .map((p) => `--- [Page ${p.pageNumber}] ---\n\n${p.text}`)
      .join('\n\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="w-full shrink-0 bg-[#0a0c12] border-t border-[#1e2333] px-3 sm:px-6 pt-2 sm:pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.6)] z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-3">
        {/* Left Side: Fidelity & Integrity Badge */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 sm:p-1.5 rounded-lg bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
              <IconDocument className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                <span>Strict 1:1 Page Guarantee</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30">
                  {pages.length} Pages Verified
                </span>
              </div>
              <p className="text-[10px] text-[#8e98a8] hidden xl:block">
                Word (.docx) pages match input scan 1:1 without reflow bleed
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Export Action Buttons in Single Row (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto touch-pan-x">
          <button
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-lg border border-[#272e42] text-xs font-mono text-[#94a3b8] hover:text-white hover:bg-[#161a25] active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
          >
            <span className="hidden sm:inline">Process New Document</span>
            <span className="sm:hidden">New Doc</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="px-2.5 py-1.5 rounded-lg border border-[#272e42] bg-[#121622] text-xs font-medium text-[#e2e8f0] hover:text-white hover:border-[#3b4664] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm shrink-0"
          >
            {copiedAll ? (
              <>
                <IconCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>Copied All Pages</span>
              </>
            ) : (
              <>
                <IconCopy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy All Text</span>
                <span className="sm:hidden">Copy All</span>
              </>
            )}
          </button>

          {/* Formats Segmented Group */}
          <div className="inline-flex items-center rounded-lg bg-[#121622] border border-[#272e42] p-0.5 text-xs font-mono shrink-0">
            <button
              onClick={handleExportTxt}
              className="px-2 py-1 rounded hover:bg-[#1c2234] active:scale-95 text-[#94a3b8] hover:text-white transition-all cursor-pointer"
              title="Export plain text with page dividers"
            >
              .TXT
            </button>
            <button
              onClick={handleExportMd}
              className="px-2 py-1 rounded hover:bg-[#1c2234] active:scale-95 text-[#94a3b8] hover:text-white transition-all cursor-pointer"
              title="Export markdown with page headings"
            >
              .MD
            </button>
            <button
              onClick={handleExportJson}
              className="px-2 py-1 rounded hover:bg-[#1c2234] active:scale-95 text-[#c59b27] font-medium hover:text-white transition-all cursor-pointer"
              title="Export Canonical Structured JSON matching PRD §14"
            >
              .JSON
            </button>
            <button
              onClick={handleExportAudit}
              className="px-2 py-1 rounded hover:bg-[#1c2234] active:scale-95 text-[#94a3b8] hover:text-white transition-all cursor-pointer"
              title="Download Processing & Provenance Audit Manifest (PRD NFR-8)"
            >
              Audit Log
            </button>
          </div>

          <button
            onClick={handleExportHtml}
            className="px-2.5 py-1.5 rounded-lg border border-[#c59b27]/40 bg-[#c59b27]/10 text-xs font-semibold text-[#f5cd5a] hover:bg-[#c59b27]/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm shrink-0"
            title="Download single-file offline interactive HTML page viewer"
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>HTML</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx || pages.length === 0}
            className="px-3.5 sm:px-4 py-1.5 rounded-lg bg-[#c59b27] text-black text-xs font-bold hover:bg-[#deb43b] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-lg shadow-[#c59b27]/20 disabled:opacity-50 shrink-0"
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>
              {isExportingDocx ? (
                'Generating...'
              ) : (
                <>
                  <span className="hidden sm:inline">Export to Word (.docx)</span>
                  <span className="sm:hidden">Word (.docx)</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
      <Footer variant="compact" />
    </div>
  );
};
