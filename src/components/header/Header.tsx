import React from 'react';
import { IconCpu, IconCocktail, IconSettings, IconDocument, IconBookOpen } from '../common/Icons';
import { JobConfig } from '../../types';

interface HeaderProps {
  config: JobConfig;
  onOpenSettings: () => void;
  onOpenAnalytics?: () => void;
  onOpenGuide?: () => void;
  hasActiveJob?: boolean;
  activeWorkersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onOpenAnalytics,
  onOpenGuide,
  hasActiveJob = false,
  activeWorkersCount,
}) => {
  return (
    <header className="border-b border-[#1c212d] bg-[#0c0e14]/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
      {/* Brand Section */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#876c1a] p-[1px] shadow-lg shadow-black/40 shrink-0">
          <div className="w-full h-full bg-[#0c0e14] rounded-[7px] flex items-center justify-center">
            <span className="font-extrabold text-[13px] tracking-tight text-[#f1f5f9]">L</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-sm tracking-wide text-white font-mono">LIPI</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-[#c59b27] tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#c59b27]/10 border border-[#c59b27]/20 font-mono">
              OCR ENGINE
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-[#8e98a8] tracking-tight truncate">
            On-Site High-Fidelity Bharatiya Document Processing
          </p>
        </div>
      </div>

      {/* Right Controls & Status */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Parallel Threads Pill (Desktop only) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131620] border border-[#202636] text-[11px] text-[#94a3b8] font-mono">
          <IconCpu className="w-3.5 h-3.5 text-[#c59b27]" />
          <span>{activeWorkersCount} / {config.workerCount} Workers</span>
        </div>

        {/* Dual-Engine Status Pill (Tablet & Desktop) */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono transition-colors ${
            config.enableAiRefinement && config.geminiApiKey
              ? 'bg-[#c59b27]/10 border-[#c59b27]/30 text-[#e6c158]'
              : 'bg-[#131620] border-[#202636] text-[#64748b]'
          }`}
          title={config.enableAiRefinement && config.geminiApiKey ? 'Dual-Engine Active (WASM + Vision AI)' : 'Base WASM Engine Only'}
        >
          <IconCocktail className="w-3.5 h-3.5" />
          <span>{config.enableAiRefinement && config.geminiApiKey ? 'Dual-Engine' : 'Base WASM'}</span>
        </div>

        {/* Analytics Trigger if document loaded */}
        {hasActiveJob && onOpenAnalytics && (
          <button
            onClick={onOpenAnalytics}
            className="p-2 rounded-md bg-[#131620] border border-[#202636] text-[#cbd5e1] hover:text-[#c59b27] hover:border-[#c59b27]/40 hover:bg-[#1a1f2e] transition-all cursor-pointer"
            title="View Document Accuracy & Fidelity Benchmark"
          >
            <IconDocument className="w-4 h-4" />
          </button>
        )}

        {/* User Guide Trigger */}
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md bg-[#c59b27]/10 border border-[#c59b27]/35 text-[#f6d26d] hover:bg-[#c59b27]/20 hover:border-[#c59b27] hover:text-white transition-all cursor-pointer text-xs font-medium shadow-sm"
            title="Open Interactive User Guide"
          >
            <IconBookOpen className="w-3.5 h-3.5 text-[#c59b27]" />
            <span className="hidden xs:inline sm:inline">Guide</span>
          </button>
        )}

        {/* Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-md bg-[#131620] border border-[#202636] text-[#cbd5e1] hover:text-white hover:border-[#333d54] hover:bg-[#1a1f2e] transition-all cursor-pointer"
          title="Configure Engine and AI Refinement"
        >
          <IconSettings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
