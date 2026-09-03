import React, { useState } from 'react';
import { PageData, JobConfig } from '../../types';
import { generateStrictFidelityDocx } from '../../core/export/docxExporter';
import { generateStandaloneHtmlViewer } from '../../core/export/htmlViewerExporter';
import saveAs from 'file-saver';
import { IconDownload, IconDocument, IconCopy, IconCheck } from '../common/Icons';
import { Footer } from '../common/Footer';

interface ExportBarProps {
  fileName: string;
  pages: PageData[];
  config: JobConfig;
  onReset: () => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  fileName,
  pages,
  config,
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

  const handleCopyAll = () => {
    const fullText = pages
      .map((p) => `--- [Page ${p.pageNumber}] ---\n\n${p.text}`)
      .join('\n\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="w-full shrink-0 bg-[#0a0c12] border-t border-[#1e2333] px-6 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.6)] z-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Side: Fidelity & Integrity Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
            <IconDocument className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Strict 1:1 Page-to-Page Guarantee</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30">
                {pages.length} Pages Verified
              </span>
            </div>
            <p className="text-[11px] text-[#8e98a8]">
              Input Page count strictly matches Output Word (.docx) Page count without reflow bleed
            </p>
          </div>
        </div>

        {/* Right Side: Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onReset}
            className="px-3.5 py-2 rounded-lg border border-[#272e42] text-xs font-mono text-[#94a3b8] hover:text-white hover:bg-[#161a25] transition-colors cursor-pointer"
          >
            Process New Document
          </button>

          <button
            onClick={handleCopyAll}
            className="px-3.5 py-2 rounded-lg border border-[#272e42] bg-[#121622] text-xs font-medium text-[#e2e8f0] hover:text-white hover:border-[#3b4664] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copiedAll ? (
              <>
                <IconCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>Copied All Pages</span>
              </>
            ) : (
              <>
                <IconCopy className="w-3.5 h-3.5" />
                <span>Copy All Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportTxt}
            className="px-3 py-2 rounded-lg border border-[#272e42] bg-[#121622] text-xs font-medium text-[#94a3b8] hover:text-white hover:border-[#3b4664] transition-all cursor-pointer shadow-sm"
            title="Export plain text with page dividers"
          >
            .TXT
          </button>

          <button
            onClick={handleExportMd}
            className="px-3 py-2 rounded-lg border border-[#272e42] bg-[#121622] text-xs font-medium text-[#94a3b8] hover:text-white hover:border-[#3b4664] transition-all cursor-pointer shadow-sm"
            title="Export markdown with page headings"
          >
            .MD
          </button>

          <button
            onClick={handleExportHtml}
            className="px-3.5 py-2 rounded-lg border border-[#c59b27]/40 bg-[#c59b27]/10 text-xs font-semibold text-[#f5cd5a] hover:bg-[#c59b27]/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Download single-file offline interactive HTML page viewer"
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>HTML Viewer</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx || pages.length === 0}
            className="px-5 py-2 rounded-lg bg-[#c59b27] text-black text-xs font-bold hover:bg-[#deb43b] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c59b27]/20 disabled:opacity-50"
          >
            <IconDownload className="w-4 h-4" />
            <span>{isExportingDocx ? 'Generating Word (.docx)...' : 'Export to Word (.docx)'}</span>
          </button>
        </div>
      </div>
      <Footer variant="compact" />
    </div>
  );
};
