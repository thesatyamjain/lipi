import React, { useState, useEffect } from 'react';
import { IconClose, IconCocktail, IconCpu, IconShieldCheck } from '../common/Icons';
import { JobConfig } from '../../types';
import { BHARATIYA_LANGUAGES } from '../../core/ocr/bharatiyaLanguages';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JobConfig;
  onSaveConfig: (newConfig: JobConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<JobConfig>(config);
  const [keyVisible, setKeyVisible] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const hardwareCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0f1118] border border-[#23293a] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1f2536] flex items-center justify-between bg-[#131622]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#c59b27]/10 text-[#c59b27]">
              <IconCocktail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Engine Configuration</h2>
              <p className="text-[11px] text-[#8e98a8]">Cocktail model settings, concurrency, and fidelity parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1f2536] transition-colors cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: AI Cocktail Model */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-2">
                <IconCocktail className="w-3.5 h-3.5 text-[#c59b27]" />
                Layer 2 Multimodal AI Refinement
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enableAiRefinement}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, enableAiRefinement: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#202636] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c59b27]"></div>
              </label>
            </div>

            <p className="text-[12px] text-[#8e98a8] leading-relaxed">
              When enabled, pages with low base OCR confidence or regional script complexity are automatically cross-checked and reconstructed via Gemini 2.5 Flash multimodal vision.
            </p>

            {/* API Key Input */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#94a3b8]">Google Gemini API Key</span>
                <span className="text-[#64748b]">Stored strictly in local browser storage</span>
              </div>
              <div className="relative">
                <input
                  type={keyVisible ? 'text' : 'password'}
                  value={localConfig.geminiApiKey}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, geminiApiKey: e.target.value })
                  }
                  placeholder="AIzaSy..."
                  className="w-full bg-[#141724] border border-[#262c3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#c59b27] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setKeyVisible(!keyVisible)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#94a3b8] hover:text-white px-1 py-0.5 rounded cursor-pointer"
                >
                  {keyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#94a3b8]">AI Refinement Threshold</span>
                <span className="text-[#c59b27] font-mono font-medium">
                  Pages &lt; {localConfig.aiConfidenceThreshold}% confidence
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={localConfig.aiConfidenceThreshold}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    aiConfidenceThreshold: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#c59b27] bg-[#202636] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#64748b] font-mono">
                <span>40% (Aggressive AI)</span>
                <span>75% (Recommended)</span>
                <span>95% (Always Refine)</span>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-[#1d2332]" />

          {/* Section 2: Concurrency & Performance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-2">
                <IconCpu className="w-3.5 h-3.5 text-[#c59b27]" />
                Web Worker Concurrency
              </label>
              <span className="text-xs font-mono text-[#c59b27]">
                {localConfig.workerCount} Parallel Threads
              </span>
            </div>
            <p className="text-[12px] text-[#8e98a8]">
              Number of background WebAssembly workers running simultaneously. Hardware reports {hardwareCores} logical CPU cores.
            </p>
            <input
              type="range"
              min="1"
              max={Math.min(16, Math.max(8, hardwareCores))}
              value={localConfig.workerCount}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  workerCount: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-[#c59b27] bg-[#202636] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#64748b] font-mono">
              <span>1 Worker (Low RAM)</span>
              <span>4 Workers</span>
              <span>8 Workers</span>
              <span>16 Workers (Turbo)</span>
            </div>
          </div>

          <div className="h-[1px] bg-[#1d2332]" />

          {/* Section 3: Bharatiya Languages & Models */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-1.5">
                <span>🇮🇳</span>
                <span>Language &amp; Script Configuration</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
                22 Languages
              </span>
            </div>

            <select
              value={localConfig.language}
              onChange={(e) => setLocalConfig({ ...localConfig, language: e.target.value })}
              className="w-full bg-[#141724] border border-[#262c3e] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c59b27] font-sans"
            >
              <optgroup label="✨ Intelligent Detection" className="bg-[#141724] text-[#c59b27] font-semibold">
                <option value="auto" className="text-white font-normal">
                  Auto-Detect Bharatiya Script per Page (Recommended for Mixed Scans)
                </option>
              </optgroup>

              <optgroup label="🇮🇳 Bilingual Pairs (English + Bharatiya)" className="bg-[#141724] text-[#c59b27] font-semibold">
                {BHARATIYA_LANGUAGES.filter((l) => l.code !== 'eng').map((lang) => (
                  <option key={lang.bilingualCode} value={lang.bilingualCode} className="text-white font-normal">
                    English + {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </optgroup>

              <optgroup label="📜 Monolingual Bharatiya Languages (All 22)" className="bg-[#141724] text-[#c59b27] font-semibold">
                {BHARATIYA_LANGUAGES.filter((l) => l.code !== 'eng').map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-white font-normal">
                    {lang.nativeName} — {lang.name} ({lang.script})
                  </option>
                ))}
              </optgroup>

              <optgroup label="🌐 Global" className="bg-[#141724] text-[#c59b27] font-semibold">
                <option value="eng" className="text-white font-normal">
                  English Only (Latin Script)
                </option>
              </optgroup>
            </select>

            <p className="text-[11px] text-[#8e98a8] leading-relaxed">
              Full native OCR &amp; Vision coverage across all 22 official languages of the 8th Schedule of the Constitution of India.
              Layer 1 uses calibrated Tesseract WASM models, and Layer 2 uses Gemini 2.5 Flash Vision for complex script reconstruction.
            </p>
          </div>

          {/* Section 4: Word Export Fidelity */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#141824] border border-[#22283a]">
            <div>
              <div className="text-xs font-medium text-white">Strict 1:1 Auto-Fit Typography</div>
              <div className="text-[11px] text-[#8e98a8]">
                Dynamically adjusts font size and line spacing on dense pages so content never overflows
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.autoFitDocx}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, autoFitDocx: e.target.checked })
              }
              className="accent-[#c59b27] w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Section 5: Adaptive Scan Preprocessing */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#141824] border border-[#22283a]">
            <div>
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <span>Adaptive Contrast &amp; Stroke Sharpening</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
                  Recommended
                </span>
              </div>
              <div className="text-[11px] text-[#8e98a8]">
                Eliminates paper shadows, scanner haze, and sharpens delicate Indic matras &amp; strokes
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.preprocessScan ?? true}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, preprocessScan: e.target.checked })
              }
              className="accent-[#c59b27] w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1f2536] bg-[#131622] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <IconShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Settings persist locally in your browser</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#283045] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-[#1a2030] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#c59b27] text-black text-xs font-semibold hover:bg-[#deb43b] transition-colors cursor-pointer shadow-md"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
