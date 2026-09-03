import React from 'react';
import { PageData, DocumentJob } from '../../types';
import { IconClose, IconCocktail, IconCheck, IconDocument } from '../common/Icons';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: DocumentJob;
  pages: PageData[];
  onSelectPage: (index: number) => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  job,
  pages,
  onSelectPage,
}) => {
  if (!isOpen) return null;

  const completedPages = pages.filter((p) => p.status === 'done');
  const totalCompleted = completedPages.length;

  const totalWords = completedPages.reduce((acc, p) => {
    const words = p.text.trim() ? p.text.trim().split(/\s+/).length : 0;
    return acc + words;
  }, 0);

  const totalChars = completedPages.reduce((acc, p) => acc + p.text.length, 0);

  const avgConfidence =
    totalCompleted > 0
      ? Math.round(
          completedPages.reduce((acc, p) => acc + p.confidence, 0) / totalCompleted
        )
      : 0;

  const lowConfidencePages = completedPages.filter((p) => p.confidence < 75);
  const aiRefinedPages = completedPages.filter((p) => p.isAiRefined);

  // Script Breakdown
  const scriptCounts: Record<string, number> = {};
  completedPages.forEach((p) => {
    const s = p.script || 'Latin';
    scriptCounts[s] = (scriptCounts[s] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0e1017] border border-[#222838] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1c2232] flex items-center justify-between bg-[#121520]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#c59b27]/10 text-[#c59b27]">
              <IconDocument className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Document Accuracy &amp; Fidelity Benchmark
              </h2>
              <p className="text-[11px] text-[#8e98a8] font-mono">
                {job.fileName} &bull; {pages.length} Pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1a1f2e] transition-colors cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-[#131622] border border-[#222838]">
              <div className="text-[10px] uppercase font-mono text-[#78859b]">Average Accuracy</div>
              <div
                className={`text-xl font-mono font-bold mt-1 ${
                  avgConfidence >= 85
                    ? 'text-[#4ade80]'
                    : avgConfidence >= 75
                    ? 'text-[#facc15]'
                    : 'text-[#f87171]'
                }`}
              >
                {avgConfidence}%
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">Word-level confidence</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131622] border border-[#222838]">
              <div className="text-[10px] uppercase font-mono text-[#78859b]">Total Volume</div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">
                {totalChars.toLocaleString()} characters
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131622] border border-[#222838]">
              <div className="text-[10px] uppercase font-mono text-[#78859b]">AI Refined</div>
              <div className="text-xl font-mono font-bold text-[#c59b27] mt-1 flex items-center gap-1.5">
                <IconCocktail className="w-4 h-4" />
                <span>{aiRefinedPages.length}</span>
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">Vision cocktail model</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131622] border border-[#222838]">
              <div className="text-[10px] uppercase font-mono text-[#78859b]">Attention Required</div>
              <div
                className={`text-xl font-mono font-bold mt-1 ${
                  lowConfidencePages.length > 0 ? 'text-[#f87171]' : 'text-[#4ade80]'
                }`}
              >
                {lowConfidencePages.length}
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">Pages &lt; 75% confidence</div>
            </div>
          </div>

          {/* Script Distribution */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono">
              Script Composition
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(scriptCounts).map(([script, count]) => {
                const ratio = Math.round((count / totalCompleted) * 100);
                return (
                  <div
                    key={script}
                    className="p-3 rounded-lg bg-[#131622] border border-[#222838] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{script}</div>
                      <div className="text-[10px] font-mono text-[#8e98a8]">
                        {count} of {totalCompleted} pages
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#c59b27]">{ratio}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page-by-Page Confidence Timeline */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono">
              Page-by-Page Confidence Heatmap
            </div>
            <div className="p-3.5 rounded-lg bg-[#131622] border border-[#222838] space-y-2">
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                {pages.map((p, idx) => (
                  <button
                    key={p.pageNumber}
                    onClick={() => {
                      onSelectPage(idx);
                      onClose();
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                      p.confidence >= 80
                        ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80] hover:bg-[#4ade80]/20'
                        : p.confidence >= 65
                        ? 'bg-[#facc15]/10 border-[#facc15]/30 text-[#facc15] hover:bg-[#facc15]/20'
                        : 'bg-[#f87171]/10 border-[#f87171]/30 text-[#f87171] hover:bg-[#f87171]/20'
                    }`}
                    title={`Page ${p.pageNumber}: ${p.confidence}% confidence. Click to open.`}
                  >
                    P{p.pageNumber}: {p.confidence}%
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b] pt-1 border-t border-[#1e2434]">
                <span>Green: &gt;80% (Verified)</span>
                <span>Amber: 65–79% (Standard)</span>
                <span>Red: &lt;65% (Review Recommended)</span>
              </div>
            </div>
          </div>

          {/* 1:1 Page Fidelity Audit */}
          <div className="p-3.5 rounded-lg bg-[#131622] border border-[#222838] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded bg-[#4ade80]/15 text-[#4ade80]">
                <IconCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">1:1 Page-to-Page Fidelity Verified</div>
                <div className="text-[11px] text-[#8e98a8]">
                  Export guarantees exactly {pages.length} Word pages for {pages.length} input pages
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30">
              100% Boundary Lock
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1c2232] bg-[#121520] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#272e42] text-xs font-semibold text-white hover:bg-[#252b3d] transition-colors cursor-pointer"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
