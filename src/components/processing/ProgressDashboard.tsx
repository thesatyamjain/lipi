import React, { useState, useEffect } from 'react';
import { DocumentJob } from '../../types';
import { IconCpu, IconDualEngine, IconAlertTriangle, IconChevronDown, IconChevronUp } from '../common/Icons';

interface ProgressDashboardProps {
  job: DocumentJob;
  activeWorkers: number;
  totalWorkers: number;
  onCancel: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onPartialExport?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  job,
  activeWorkers,
  totalWorkers,
  onCancel,
  onPause,
  onResume,
  onPartialExport,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [now, setNow] = useState(Date.now());

  // 1-second live ticker so ETA countdown and elapsed time update smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const completedCount = job.pages.filter(
    (p) => p.status === 'done' || p.status === 'refining'
  ).length;
  const percent = job.totalPages > 0 ? Math.round((completedCount / job.totalPages) * 100) : 0;

  // Effective concurrency across worker pool
  const concurrency = Math.max(1, totalWorkers || activeWorkers || 2);

  // Live elapsed time since job started (in seconds)
  const elapsedSec = job.startTime ? Math.max(1, (now - job.startTime) / 1000) : 1;

  // Remaining pages to complete
  const remainingPages = Math.max(0, job.totalPages - completedCount);

  // Dynamic Concurrency-Aware ETA (PRD §7.2)
  let etaSec = 0;
  if (completedCount === 0) {
    // Initial warm-up: estimate based on page count & parallel workers
    const estimatedBatches = Math.ceil(job.totalPages / concurrency);
    const totalExpectedSec = estimatedBatches * 3.0; // ~3.0s per batch on WebAssembly Indic OCR
    etaSec = Math.max(1, Math.round(totalExpectedSec - elapsedSec));
  } else if (remainingPages === 0) {
    etaSec = 0;
  } else {
    // Empirical phase: calculate actual pool throughput (pages per second)
    const poolRatePerSec = completedCount / elapsedSec;
    if (poolRatePerSec > 0) {
      etaSec = Math.max(1, Math.round(remainingPages / poolRatePerSec));
    } else {
      const remainingBatches = Math.ceil(remainingPages / concurrency);
      etaSec = Math.max(1, remainingBatches * 3);
    }
  }

  // Live Throughput (pages per minute)
  const pagesPerMin = completedCount > 0
    ? ((completedCount / elapsedSec) * 60).toFixed(1)
    : ((concurrency / 3.0) * 60).toFixed(0);

  // Formatted ETA display string
  let etaDisplay: string;
  if (job.status === 'paused') {
    etaDisplay = 'Paused';
  } else if (completedCount === job.totalPages && job.totalPages > 0) {
    etaDisplay = 'Done';
  } else if (etaSec < 60) {
    etaDisplay = `${etaSec}s`;
  } else {
    const mins = Math.floor(etaSec / 60);
    const secs = etaSec % 60;
    etaDisplay = `${mins}m ${secs}s`;
  }

  const lowConfidenceCount = job.pages.filter(
    (p) => p.status === 'done' && p.confidence < 75
  ).length;

  const aiRefinedCount = job.pages.filter((p) => p.isAiRefined).length;

  // Minimized floating pill view
  if (isCollapsed) {
    return (
      <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="bg-[#0c0e15]/95 backdrop-blur-md border border-[#c59b27]/40 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.7)] px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2.5 sm:gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ade80]" />
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-mono text-white font-medium">
              OCR {percent}%
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#94a3b8]">
              ({completedCount}/{job.totalPages} p.) &bull; <span className="text-[#c59b27] font-semibold">{etaDisplay}</span>
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1b2130] transition-colors cursor-pointer"
            title="Expand Processing Details"
          >
            <IconChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded floating card view
  return (
    <div className="fixed bottom-20 sm:bottom-24 left-3 right-3 sm:left-auto sm:right-5 sm:w-[380px] z-40 animate-in fade-in slide-in-from-bottom-4 duration-250">
      <div className="bg-[#0c0e16]/95 backdrop-blur-md border border-[#242c40] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.75)] p-3.5 sm:p-4 space-y-3 sm:space-y-3.5 font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ade80]" />
            </span>

            <h3
              className="text-xs font-semibold text-white truncate font-mono"
              title={job.fileName}
            >
              {job.fileName}
            </h3>

            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#161a25] border border-[#252c3e] text-[#8e98a8] shrink-0">
              {(job.fileSize / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {job.status === 'processing' && onPause && (
              <button
                onClick={onPause}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1c2233] border border-[#334061] text-[#93c5fd] hover:bg-[#27324d] hover:text-white transition-colors cursor-pointer"
                title="Pause OCR processing queue cleanly between pages"
              >
                Pause
              </button>
            )}

            {job.status === 'paused' && onResume && (
              <button
                onClick={onResume}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#162a1b] border border-[#2b5d35] text-[#86efac] hover:bg-[#203f27] hover:text-white transition-colors cursor-pointer"
                title="Resume OCR processing"
              >
                Resume
              </button>
            )}

            {completedCount > 0 && onPartialExport && (
              <button
                onClick={onPartialExport}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#221f14] border border-[#52441f] text-[#fde047] hover:bg-[#332c18] hover:text-white transition-colors cursor-pointer"
                title="Export currently completed pages immediately (PRD §7.2 Partial Download)"
              >
                Export ({completedCount})
              </button>
            )}

            {(job.status === 'processing' || job.status === 'paused') && (
              <button
                onClick={onCancel}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#2b1616] border border-[#502626] text-[#f87171] hover:bg-[#3d1d1d] hover:text-white transition-colors cursor-pointer"
                title="Cancel document processing"
              >
                Cancel
              </button>
            )}

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1a2030] transition-colors cursor-pointer"
              title="Minimize to Floating Pill"
            >
              <IconChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#94a3b8]">
              Page {completedCount} of {job.totalPages} &bull; ETA: <span className="text-[#c59b27] font-semibold">{etaDisplay}</span>
            </span>
            <span className="text-white font-semibold font-mono text-xs">
              {percent}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#151924] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8a6c1e] via-[#c59b27] to-[#e7be46] transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1a202f] text-[11px] font-mono text-[#8e98a8]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748b]">Speed:</span>
            <span className="text-[#c59b27] font-semibold">{pagesPerMin} p/m</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#64748b]">Lanes:</span>
            <div className="flex items-center gap-1 text-white font-semibold">
              <IconCpu className="w-3 h-3 text-[#4ade80]" />
              <span>{activeWorkers}/{totalWorkers}</span>
            </div>
          </div>

          {aiRefinedCount > 0 && (
            <div className="flex items-center gap-1 text-[#e6c158]">
              <IconDualEngine className="w-3 h-3" />
              <span>{aiRefinedCount} AI</span>
            </div>
          )}

          {lowConfidenceCount > 0 && (
            <div className="flex items-center gap-1 text-[#fbbf24]">
              <IconAlertTriangle className="w-3 h-3" />
              <span>{lowConfidenceCount} &lt;75%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
