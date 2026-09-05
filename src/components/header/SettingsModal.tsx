import React, { useState, useEffect } from 'react';
import {
  IconClose,
  IconSettings,
  IconCpu,
  IconShieldCheck,
  IconDocument,
  IconDualEngine,
  IconRotate,
  IconCheck,
  IconAlertTriangle,
} from '../common/Icons';
import { JobConfig, DEFAULT_JOB_CONFIG } from '../../types';
import { BHARATIYA_LANGUAGES } from '../../core/ocr/bharatiyaLanguages';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JobConfig;
  onSaveConfig: (newConfig: JobConfig) => void;
}

type SettingsTab = 'all' | 'ai' | 'languages' | 'style' | 'performance';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<JobConfig>(config);
  const [keyVisible, setKeyVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  useEffect(() => {
    setLocalConfig(config);
    setTestStatus('idle');
    setTestMessage('');
  }, [config, isOpen]);

  // Keyboard Escape listener to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const hardwareCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;

  const handleResetDefaults = () => {
    setLocalConfig({
      ...DEFAULT_JOB_CONFIG,
      workerCount: Math.min(16, Math.max(2, hardwareCores)),
    });
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleTestApiKey = async () => {
    const key = localConfig.geminiApiKey?.trim();
    if (!key) {
      setTestStatus('invalid');
      setTestMessage('Please enter an API key first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        setTestStatus('valid');
        setTestMessage('API key is active and authorized.');
      } else {
        const data = await res.json().catch(() => ({}));
        setTestStatus('invalid');
        setTestMessage(data.error?.message || `Validation failed (HTTP ${res.status})`);
      }
    } catch (err: any) {
      setTestStatus('invalid');
      setTestMessage(err.message || 'Network error contacting Gemini API.');
    }
  };

  const standardModels = ['gemini-3.6-flash', 'gemini-3.6-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const isCustomModel = !standardModels.includes(localConfig.modelName || 'gemini-3.6-flash');

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'all', label: 'All Settings' },
    { id: 'ai', label: 'AI & Vision' },
    { id: 'languages', label: '22 Languages' },
    { id: 'style', label: 'Document Style' },
    { id: 'performance', label: 'Performance & Export' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#0f1118] border border-[#23293a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1f2536] flex items-center justify-between bg-[#131622] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
              <IconSettings className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-tight">Engine Settings</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
                  Lipi v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#8e98a8]">
                Configure AI vision models, 22 Bharatiya languages, worker concurrency, and export fidelity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1f2536] transition-colors cursor-pointer"
            title="Close Settings (Esc)"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-3 sm:px-6 py-2 bg-[#0a0c12] border-b border-[#1d2332] overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#c59b27] text-black font-semibold shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#161a26]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Dual-Engine Vision AI */}
          {(activeTab === 'all' || activeTab === 'ai') && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-2">
                  <IconDualEngine className="w-3.5 h-3.5 text-[#c59b27]" />
                  Dual-Engine Vision AI Refinement
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
              When enabled with a Gemini API key, pages are cross-checked via Gemini Flash multimodal vision for deep script correction — especially effective for complex Indic ligatures, matras, and bilingual layouts.
            </p>

              {/* API Key Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8] font-medium">Google Gemini API Key</span>
                  <span className="text-[#64748b]">Stored locally in browser</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={keyVisible ? 'text' : 'password'}
                      value={localConfig.geminiApiKey}
                      onChange={(e) => {
                        setLocalConfig({ ...localConfig, geminiApiKey: e.target.value });
                        setTestStatus('idle');
                        setTestMessage('');
                      }}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#141724] border border-[#262c3e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#c59b27] font-mono pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setKeyVisible(!keyVisible)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[#94a3b8] hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {keyVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={testStatus === 'testing' || !localConfig.geminiApiKey}
                    className="px-3 py-2 rounded-lg bg-[#181d2c] border border-[#2d374f] text-[#cbd5e1] hover:text-white hover:border-[#c59b27]/60 text-xs font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {testStatus === 'testing' ? 'Testing...' : 'Test Key'}
                  </button>
                </div>

                {/* API Key Test Result Feedback */}
                {testStatus === 'valid' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#4ade80] bg-[#122818] border border-[#276435] rounded-md px-2.5 py-1 mt-1">
                    <IconCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>{testMessage}</span>
                  </div>
                )}
                {testStatus === 'invalid' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#f87171] bg-[#291313] border border-[#5d2323] rounded-md px-2.5 py-1 mt-1">
                    <IconAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{testMessage}</span>
                  </div>
                )}
              </div>

              {/* Model Tier Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#94a3b8] font-medium">Gemini Multimodal Model Tier</span>
                  <span className="text-[#64748b]">PRD §5.2 Hierarchy</span>
                </div>
                <select
                  value={isCustomModel ? 'custom' : (localConfig.modelName || 'gemini-3.6-flash')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setLocalConfig({ ...localConfig, modelName: 'custom-model' });
                    } else {
                      setLocalConfig({ ...localConfig, modelName: val });
                    }
                  }}
                  className="w-full bg-[#141724] border border-[#262c3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c59b27] font-mono cursor-pointer"
                >
                  <option value="gemini-3.6-flash">gemini-3.6-flash (Primary Recommended Default)</option>
                  <option value="gemini-3.6-pro">gemini-3.6-pro (Deep Reasoning &amp; Rare Manuscripts)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Fast Multimodal Fallback)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Legacy Compatibility)</option>
                  <option value="custom">Custom Endpoint / Fine-Tuned Model</option>
                </select>

                {isCustomModel && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={localConfig.modelName || ''}
                      onChange={(e) =>
                        setLocalConfig({ ...localConfig, modelName: e.target.value.trim() })
                      }
                      placeholder="e.g. gemini-3.6-flash-exp or fine-tuned model identifier"
                      className="w-full bg-[#141724] border border-[#c59b27]/60 rounded-lg px-3 py-2 text-xs text-white placeholder-[#475569] font-mono focus:outline-none focus:border-[#c59b27]"
                    />
                  </div>
                )}
              </div>

              {/* AI Always-On Notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#c59b27]/8 border border-[#c59b27]/20 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] mt-1.5 shrink-0 animate-pulse" />
                <p className="text-[11px] text-[#c59b27]/90 leading-relaxed">
                  AI refinement runs on <strong>every page</strong> when enabled. Tesseract confidence heuristics alone are unreliable for complex Indic ligatures, so Gemini Vision cross-checks the page scan directly.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'all' && <div className="h-[1px] bg-[#1d2332]" />}

          {/* TAB: Bharatiya Languages & Scripts */}
          {(activeTab === 'all' || activeTab === 'languages') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#c59b27]/15 text-[#e6c158] font-mono text-[10px] font-bold">
                    BHARAT
                  </span>
                  <span>Language &amp; Script Configuration</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
                  22 Official Languages
                </span>
              </div>

              <select
                value={localConfig.language}
                onChange={(e) => setLocalConfig({ ...localConfig, language: e.target.value })}
                className="w-full bg-[#141724] border border-[#262c3e] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c59b27] font-sans cursor-pointer"
              >
                <optgroup label="Intelligent Script Detection" className="bg-[#141724] text-[#c59b27] font-semibold">
                  <option value="auto" className="text-white font-normal">
                    Auto-Detect Bharatiya Script per Page (Recommended for Multi-Script Scans)
                  </option>
                </optgroup>

                <optgroup label="Bilingual Pairs (English + Bharatiya)" className="bg-[#141724] text-[#c59b27] font-semibold">
                  {BHARATIYA_LANGUAGES.filter((l) => l.code !== 'eng').map((lang) => (
                    <option key={lang.bilingualCode} value={lang.bilingualCode} className="text-white font-normal">
                      English + {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Monolingual Bharatiya Languages (All 22)" className="bg-[#141724] text-[#c59b27] font-semibold">
                  {BHARATIYA_LANGUAGES.filter((l) => l.code !== 'eng').map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-white font-normal">
                      {lang.nativeName} — {lang.name} ({lang.script})
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Global Standard" className="bg-[#141724] text-[#c59b27] font-semibold">
                  <option value="eng" className="text-white font-normal">
                    English Only (Latin Script)
                  </option>
                </optgroup>
              </select>

              <p className="text-[11px] text-[#8e98a8] leading-relaxed">
                Full native OCR &amp; Vision coverage across all 22 official languages of the 8th Schedule of the Constitution of India.
                Layer 1 runs calibrated Tesseract WASM models, and Layer 2 provides orthographic character reconstruction.
              </p>
            </div>
          )}

          {activeTab === 'all' && <div className="h-[1px] bg-[#1d2332]" />}

          {/* TAB: Document Style / Mode */}
          {(activeTab === 'all' || activeTab === 'style') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-2">
                  <span className="text-[#c59b27] font-bold">STYLE</span>
                  <span>Document Style &amp; Handwriting Mode</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
                  {localConfig.documentMode === 'handwritten'
                    ? 'Handwritten Active'
                    : localConfig.documentMode === 'mixed'
                    ? 'Mixed Forms'
                    : 'Standard Typeset'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'printed',
                    title: 'Typeset / Printed',
                    desc: 'Books, gazettes, typed affidavits, and legal briefs',
                    badge: 'Print',
                  },
                  {
                    id: 'handwritten',
                    title: 'Handwritten / Cursive',
                    desc: 'Manuscripts, diary notes, cursive petitions (हस्तलिखित)',
                    badge: 'Manuscript',
                  },
                  {
                    id: 'mixed',
                    title: 'Mixed Forms',
                    desc: 'Printed forms with handwritten user entries',
                    badge: 'Hybrid',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      setLocalConfig({
                        ...localConfig,
                        documentMode: mode.id as any,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      (localConfig.documentMode || 'printed') === mode.id
                        ? 'bg-[#c59b27]/12 border-[#c59b27] text-white shadow-sm'
                        : 'bg-[#141724] border-[#22283a] text-[#8e98a8] hover:border-[#354058] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <IconDocument className="w-4 h-4 text-[#c59b27]" />
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#202738] text-[#94a3b8]">
                        {mode.badge}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{mode.title}</div>
                      <div className="text-[10px] text-[#8e98a8] mt-1 leading-snug">{mode.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-[#8e98a8] leading-relaxed">
                When <strong>Handwritten Mode</strong> is selected, stroke contrast thresholds are softened and Gemini Vision interprets unconstrained cursive ligatures and margin annotations.
              </p>
            </div>
          )}

          {activeTab === 'all' && <div className="h-[1px] bg-[#1d2332]" />}

          {/* TAB: Performance & Export */}
          {(activeTab === 'all' || activeTab === 'performance') && (
            <div className="space-y-4">
              {/* Web Worker Concurrency */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-2">
                    <IconCpu className="w-3.5 h-3.5 text-[#c59b27]" />
                    WebAssembly Worker Concurrency
                  </label>
                  <span className="text-xs font-mono text-[#c59b27] font-semibold">
                    {localConfig.workerCount} Parallel Threads
                  </span>
                </div>
                <p className="text-[12px] text-[#8e98a8]">
                  Number of background WebAssembly workers running in parallel. Hardware reports {hardwareCores} logical CPU cores.
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
                  <span>1 Core (Low RAM)</span>
                  <span>4 Cores (Balanced)</span>
                  <span>8 Cores</span>
                  <span>16 Cores (Turbo)</span>
                </div>
              </div>

              {/* Word Export Fidelity */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#141824] border border-[#22283a]">
                <div>
                  <div className="text-xs font-medium text-white">Strict 1:1 Auto-Fit Typography</div>
                  <div className="text-[11px] text-[#8e98a8]">
                    Dynamically scales font size and line spacing on dense pages so output never overflows margins
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

              {/* Adaptive Scan Preprocessing */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#141824] border border-[#22283a]">
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#1f2536] bg-[#131622] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1 text-[11px] text-[#94a3b8] hover:text-white px-2 py-1 rounded bg-[#161a26] border border-[#262f42] hover:border-[#384562] transition-colors cursor-pointer"
              title="Reset all settings to default values"
            >
              <IconRotate className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#64748b]">
              <IconShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>Saved locally in browser</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#283045] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-[#1a2030] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#c59b27] text-black text-xs font-semibold hover:bg-[#deb43b] transition-colors cursor-pointer shadow-md text-center"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
