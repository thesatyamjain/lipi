import React, { useState, useMemo } from 'react';
import { PageData } from '../../types';
import { IconDualEngine, IconAlertTriangle, IconCheck } from '../common/Icons';

interface PageGridProps {
  pages: PageData[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onBatchRefineLowConfidence?: () => void;
  isBatchRefining?: boolean;
  canRefineAi?: boolean;
}

export const PageGrid: React.FC<PageGridProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onBatchRefineLowConfidence,
  isBatchRefining = false,
  canRefineAi = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'low_conf' | 'refined'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const lowConfidenceCount = useMemo(
    () => pages.filter((p) => p.status === 'done' && p.confidence < 75).length,
    [pages]
  );

  const refinedCount = useMemo(() => pages.filter((p) => p.isAiRefined).length, [pages]);

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      // Filter tab check
      if (filter === 'low_conf' && (p.status !== 'done' || p.confidence >= 75)) return false;
      if (filter === 'refined' && !p.isAiRefined) return false;

      // Text search check
      if (searchQuery.trim().length > 0) {
        return p.text.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }

      return true;
    });
  }, [pages, filter, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2">
      <div className="bg-[#0b0d14] border border-[#1e2333] rounded-xl p-2.5 sm:p-3 space-y-2.5 sm:space-y-3">
        {/* Bar: Controls, Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 px-1">
          {/* Left: Filter Buttons */}
          <div className="flex items-center gap-1.5 font-mono text-xs overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                filter === 'all'
                  ? 'bg-[#1e2434] text-white border border-[#2e374f]'
                  : 'text-[#8e98a8] hover:text-white'
              }`}
            >
              All ({pages.length})
            </button>

            <button
              onClick={() => setFilter('low_conf')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'low_conf'
                  ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30'
                  : 'text-[#8e98a8] hover:text-[#fbbf24]'
              }`}
            >
              <IconAlertTriangle className="w-3 h-3" />
              <span>Review Needed ({lowConfidenceCount})</span>
            </button>

            {refinedCount > 0 && (
              <button
                onClick={() => setFilter('refined')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  filter === 'refined'
                    ? 'bg-[#c59b27]/15 text-[#c59b27] border border-[#c59b27]/30'
                    : 'text-[#8e98a8] hover:text-[#c59b27]'
                }`}
              >
                <IconDualEngine className="w-3 h-3" />
                <span>AI Refined ({refinedCount})</span>
              </button>
            )}
          </div>

          {/* Right: Search & Batch Action */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search within document */}
            <input
              type="text"
              placeholder="Search in pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#121520] border border-[#23293b] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#505c75] focus:outline-none focus:border-[#c59b27] w-full sm:w-44 font-sans"
            />

            {/* Batch Refine Button */}
            {lowConfidenceCount > 0 && onBatchRefineLowConfidence && canRefineAi && (
              <button
                onClick={onBatchRefineLowConfidence}
                disabled={isBatchRefining}
                className="shrink-0 px-2.5 py-1 rounded-md bg-[#c59b27]/10 border border-[#c59b27]/30 text-[#f5cd5a] text-xs font-mono font-medium hover:bg-[#c59b27]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <IconDualEngine className="w-3 h-3" />
                <span>
                  {isBatchRefining
                    ? 'Refining Batch...'
                    : `Batch Refine (${lowConfidenceCount})`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Horizontal scrollable row of page thumbnails */}
        {filteredPages.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#64748b] font-mono">
            No pages match the active filter or search query.
          </div>
        ) : (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 px-1 touch-pan-x no-scrollbar">
            {filteredPages.map((page) => {
              const originalIndex = pages.findIndex((p) => p.pageNumber === page.pageNumber);
              const isSelected = originalIndex === currentPageIndex;
              const isDone = page.status === 'done';
              const isProcessing = page.status === 'processing' || page.status === 'rendering';
              const isLowConfidence = isDone && page.confidence < 75;

              return (
                <div
                  key={page.pageNumber}
                  onClick={() => onSelectPage(originalIndex)}
                  className={`relative shrink-0 w-24 sm:w-28 rounded-lg overflow-hidden border transition-all cursor-pointer bg-[#12151f] flex flex-col active:scale-95 ${
                    isSelected
                      ? 'border-[#c59b27] ring-1 ring-[#c59b27] shadow-lg shadow-[#c59b27]/10 -translate-y-0.5'
                      : 'border-[#22283a] hover:border-[#3a4461]'
                  }`}
                >
                  {/* Thumbnail Image Container */}
                  <div className="h-28 sm:h-36 bg-[#07090f] flex items-center justify-center overflow-hidden relative p-1">
                    {page.thumbnailUrl ? (
                      <img
                        src={page.thumbnailUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-contain rounded-sm opacity-90 hover:opacity-100 transition-opacity drop-shadow"
                      />
                    ) : (
                      <div className="text-[10px] text-[#475569] font-mono">Loading...</div>
                    )}

                    {/* Status Overlay Badges */}
                    <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
                      {page.isAiRefined && (
                        <span className="p-1 rounded bg-[#0c0e14]/90 text-[#f5cd5a] border border-[#c59b27]/40 shadow">
                          <IconDualEngine className="w-2.5 h-2.5" />
                        </span>
                      )}

                      {isLowConfidence && !page.isAiRefined && (
                        <span className="p-1 rounded bg-[#0c0e14]/90 text-[#facc15] border border-[#facc15]/40 shadow">
                          <IconAlertTriangle className="w-2.5 h-2.5" />
                        </span>
                      )}

                      {isDone && !isLowConfidence && !page.isAiRefined && (
                        <span className="p-0.5 rounded bg-[#0c0e14]/90 text-[#4ade80] border border-[#4ade80]/40 shadow">
                          <IconCheck className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Processing animation */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5">
                        <div className="w-4 h-4 border-2 border-[#c59b27] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] font-mono text-[#cbd5e1]">OCR...</span>
                      </div>
                    )}
                  </div>

                  {/* Page Footer Info */}
                  <div className="p-1.5 border-t border-[#1e2434] bg-[#0e111a] flex items-center justify-between text-[10px] font-mono">
                    <span className="font-semibold text-white">P. {page.pageNumber}</span>
                    {isDone && (
                      <span
                        className={
                          page.confidence >= 80
                            ? 'text-[#4ade80]'
                            : page.confidence >= 65
                            ? 'text-[#facc15]'
                            : 'text-[#f87171]'
                        }
                      >
                        {page.confidence}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
