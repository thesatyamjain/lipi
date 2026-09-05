import React, { useState } from 'react';
import {
  IconClose,
  IconBookOpen,
  IconDualEngine,
  IconShieldCheck,
  IconDocument,
} from '../common/Icons';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo?: () => void;
  onOpenSettings?: () => void;
}

type GuideTab = 'quickstart' | 'languages' | 'dual-engine' | 'export' | 'privacy' | 'shortcuts';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadDemo,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-3xl bg-[#0f1118] border border-[#23293a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#1f2536] flex items-center justify-between bg-[#131622] shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
              <IconBookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-tight">Lipi OCR User Manual</h2>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#8e98a8]">
                On-Site High-Fidelity Bharatiya Document Processing Guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1f2536] transition-colors cursor-pointer"
            title="Close Guide"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 px-3 sm:px-6 py-1.5 sm:py-2 bg-[#0c0e14] border-b border-[#1d2332] overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'quickstart', label: 'Quick Start' },
            { id: 'languages', label: '22 Bharatiya Languages' },
            { id: 'dual-engine', label: 'Dual-Engine AI Setup' },
            { id: 'export', label: '1:1 Page Export' },
            { id: 'privacy', label: 'Privacy & Offline' },
            { id: 'shortcuts', label: 'Shortcuts & Tips' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GuideTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#1e2434] text-white border border-[#2f384f] shadow-sm font-semibold'
                  : 'text-[#8e98a8] hover:text-[#cbd5e1] hover:bg-[#131620]'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#cbd5e1] text-xs leading-relaxed font-sans flex-1">
          {/* TAB 1: QUICK START */}
          {activeTab === 'quickstart' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span className="text-[#c59b27] font-mono">01</span>
                  <span>How Lipi Works in 30 Seconds</span>
                </div>
                <p className="text-[12px] text-[#94a3b8]">
                  Lipi eliminates cloud risks and page overflow. Documents are decoded inside your browser memory and processed concurrently across CPU cores.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#10131d] border border-[#1e2435] space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-[#c59b27]/10 text-[#c59b27] flex items-center justify-center font-bold font-mono text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-semibold text-white">Upload Scans</h4>
                  <p className="text-[11px] text-[#8e98a8]">
                    Drop any multi-page PDF (up to 300+ pages), TIFF, or JPG/PNG image into the drop zone.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#10131d] border border-[#1e2435] space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4ade80]/10 text-[#4ade80] flex items-center justify-center font-bold font-mono text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-semibold text-white">Parallel OCR</h4>
                  <p className="text-[11px] text-[#8e98a8]">
                    Pages run simultaneously across your computer's CPU threads without uploading to a server.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#10131d] border border-[#1e2435] space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-[#60a5fa]/10 text-[#60a5fa] flex items-center justify-center font-bold font-mono text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-semibold text-white">1:1 Word Export</h4>
                  <p className="text-[11px] text-[#8e98a8]">
                    Export to Word (.docx) with hard section breaks. Input Page N strictly equals Output Page N.
                  </p>
                </div>
              </div>

              {/* Action Callout */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-[#131722] border border-[#22293b] gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Want to try without a file right now?</div>
                  <div className="text-[11px] text-[#8e98a8]">
                    Test the 3-page bilingual specimen with Hindi and English text extraction.
                  </div>
                </div>
                {onLoadDemo && (
                  <button
                    onClick={() => {
                      onClose();
                      onLoadDemo();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#c59b27] text-black font-semibold text-xs hover:bg-[#deb43b] transition-all cursor-pointer shadow-md shrink-0"
                  >
                    Load Demo Specimen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 22 BHARATIYA LANGUAGES */}
          {activeTab === 'languages' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Eighth Schedule Bharatiya Languages</h3>
                <p className="text-[11px] text-[#8e98a8]">
                  Lipi OCR includes Unicode character analyzers and calibrated models for all 22 official scheduled languages of India:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                {[
                  { name: 'Hindi', native: 'हिन्दी', script: 'Devanagari' },
                  { name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
                  { name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
                  { name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
                  { name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
                  { name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
                  { name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
                  { name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
                  { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
                  { name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia' },
                  { name: 'Urdu', native: 'اردو', script: 'Perso-Arabic' },
                  { name: 'Assamese', native: 'অসমীয়া', script: 'Bengali' },
                  { name: 'Sanskrit', native: 'संस्कृतम्', script: 'Devanagari' },
                  { name: 'Nepali', native: 'नेपाली', script: 'Devanagari' },
                  { name: 'Bodo', native: 'बड़ो', script: 'Devanagari' },
                  { name: 'Dogri', native: 'डोगरी', script: 'Devanagari' },
                  { name: 'Konkani', native: 'कोंकणी', script: 'Devanagari' },
                  { name: 'Maithili', native: 'मैथिली', script: 'Devanagari' },
                  { name: 'Kashmiri', native: 'कॉशुर / کٲشُر', script: 'Perso-Arabic' },
                  { name: 'Manipuri', native: 'মৈতৈলোন্', script: 'Bengali' },
                  { name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki' },
                  { name: 'Sindhi', native: 'سنڌي / सिन्धी', script: 'Perso-Arabic' },
                  { name: 'English', native: 'English', script: 'Latin (Bilingual)' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="p-2.5 rounded-lg bg-[#121520] border border-[#1e2434] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{item.native}</span>
                      <span className="text-[10px] font-mono text-[#c59b27]">{item.script}</span>
                    </div>
                    <span className="text-[#8e98a8] text-[10px]">{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293b] space-y-1.5">
                <div className="text-xs font-semibold text-white">How to select a language:</div>
                <p className="text-[11px] text-[#94a3b8]">
                  Open <strong>Settings</strong> in the top header. You can pick <strong>Auto-Detect</strong>, any of the <strong>Bilingual Pairs</strong> (e.g. English + Tamil, English + Hindi), or an individual regional language.
                </p>
              </div>

              {/* Frontier Reality of Indic OCR */}
              <div className="p-4 rounded-xl bg-[#121622] border border-[#222a3d] space-y-2.5">
                <div className="text-xs font-semibold text-[#c59b27] flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#c59b27]">BHARAT</span>
                  <span>The Frontier Reality of Indic OCR &amp; Layout Parsing</span>
                </div>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Unlike Latin scripts where letters follow a clean linear 1D baseline, Indic scripts are 2-dimensional. The continuous <strong className="text-white">Shirorekha (headline)</strong> ties adjacent characters together, vowels (matras) attach in 4 distinct directions (above, below, left, right), and complex conjuncts (samyuktaksharas like <em>क्ष, त्र, ज्ञ, द्ध</em>) alter glyph shapes entirely.
                </p>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Even frontier labs like <strong className="text-white">AI4Bharat (IIT Madras)</strong> note that Indic Document Layout Parsing and degraded scan OCR remain nascent. Traditional single-model tools (Tesseract, Google Vision) often fragment words or drop matras on photocopies.
                </p>
                <div className="p-2.5 rounded-lg bg-[#0c0e14] border border-[#1b2232] space-y-1">
                  <div className="text-[11px] font-semibold text-[#4ade80]">How Lipi bridges this frontier gap:</div>
                  <ul className="list-disc list-inside text-[10px] text-[#8e98a8] space-y-0.5">
                    <li><strong className="text-[#cbd5e1]">Layer 1 WASM Anchor:</strong> Local layout and character bounds without uploading files.</li>
                    <li><strong className="text-[#cbd5e1]">Layer 2 Multimodal AI:</strong> Gemini 3.6 Flash deciphers broken shirorekhas, tables, and seals using context.</li>
                    <li><strong className="text-[#cbd5e1]">Indic Unicode Normalizer:</strong> Automatic NFC composition, orphan matra repair, and Danda (।) restoration.</li>
                    <li><strong className="text-[#cbd5e1]">Side-by-Side Verification:</strong> Immediate human-in-the-loop audit for legal and government records.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUAL-ENGINE AI VISION */}
          {activeTab === 'dual-engine' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <IconDualEngine className="w-4 h-4 text-[#c59b27]" />
                    <span>The Dual-Engine Pipeline</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c59b27]/10 text-[#c59b27] border border-[#c59b27]/20">
                    Gemini 3.6 Flash
                  </span>
                </div>
                <p className="text-[12px] text-[#94a3b8]">
                  Complex Indic ligatures, faint rubber stamps, and low-contrast photocopy scans can challenge single-model engines. Lipi pairs local WebAssembly character detection with multimodal vision refinement.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  3 Steps to Enable AI Refinement:
                </h4>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#11141e] border border-[#1f2637] flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-[#c59b27]">1.</span>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white text-xs">Get a Free Google Gemini API Key</div>
                      <div className="text-[11px] text-[#8e98a8]">
                        Visit <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[#c59b27] underline">aistudio.google.com</a> and click "Get API Key". It's free and takes 15 seconds.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#11141e] border border-[#1f2637] flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-[#c59b27]">2.</span>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white text-xs">Add Your Key in Settings</div>
                      <div className="text-[11px] text-[#8e98a8]">
                        Click <strong>Settings</strong> in the top right. Toggle AI Refinement to ON, paste your key, and adjust your confidence threshold (default: 75%).
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#11141e] border border-[#1f2637] flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-[#c59b27]">3.</span>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white text-xs">Refine Automatically or on Demand</div>
                      <div className="text-[11px] text-[#8e98a8]">
                        Pages with confidence below your threshold will refine automatically. You can also click the <strong>Refine Page with AI</strong> button in the side-by-side viewer at any time.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {onOpenSettings && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#1a2030] border border-[#2b354c] text-white hover:bg-[#20273c] hover:border-[#c59b27]/40 text-xs font-medium transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Open Settings to Enter API Key</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 1:1 PAGE EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Strict 1:1 Page Fidelity Guarantee</h3>
                <p className="text-[11px] text-[#8e98a8]">
                  Unlike ordinary OCR tools that let text flow arbitrarily onto new pages, Lipi is architected to keep page numbers permanently locked:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#121622] border border-[#202636] space-y-1.5">
                  <div className="text-xs font-semibold text-[#c59b27] flex items-center gap-2">
                    <IconDocument className="w-4 h-4" />
                    <span>Microsoft Word (.docx) Guarantee</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Hard OpenXML section boundaries are injected between pages. Even if page content is dense, adaptive typography automatically tightens font size and line spacing to prevent accidental page spills.
                  </p>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Page 42 in your court scan remains strictly Page 42 in Word, complete with native Word sidebar bookmarks for instant navigation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#121622] border border-[#202636] space-y-1.5">
                  <div className="text-xs font-semibold text-[#4ade80] flex items-center gap-2">
                    <IconDocument className="w-4 h-4" />
                    <span>Standalone Offline HTML Viewer (.html)</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Exports a self-contained single-page web app. It embeds the entire document text, page dropdowns, confidence scores, and one-click clipboard copying. Opens on any PC, phone, or tablet with zero internet required.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#121622] border border-[#202636] space-y-1.5">
                  <div className="text-xs font-semibold text-[#cbd5e1] flex items-center gap-2">
                    <IconDocument className="w-4 h-4" />
                    <span>Plain Text (.txt) &amp; Markdown (.md)</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Clean, unformatted text export with standard ASCII boundary delimiters (<code>==================== PAGE N ====================</code>) or Markdown headers for database ingestion and archival.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#121622] border border-[#202636] space-y-1.5">
                  <div className="text-xs font-semibold text-[#c59b27] flex items-center gap-2 font-mono">
                    <span>&#123; &#125;</span>
                    <span>Canonical Structured JSON (.json &mdash; PRD &sect;14)</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Machine-readable intermediate representation structuring each page into categorized blocks (<code>paragraph</code>, <code>table</code>, <code>heading</code>, <code>handwriting</code>) with sequential reading order, script tags, confidence ratings, and review indicators.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#121622] border border-[#202636] space-y-1.5">
                  <div className="text-xs font-semibold text-[#38bdf8] flex items-center gap-2 font-mono">
                    <IconShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                    <span>Processing &amp; Provenance Audit Manifest (PRD NFR-8)</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Cryptographically tracked execution manifest for institutional, legal, and court compliance. Records model identifiers, worker thread concurrency, timestamps, average accuracy metrics, and page-by-page verification states.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & OFFLINE */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#101918] border border-[#1f382a] space-y-2">
                <div className="text-xs font-semibold text-[#4ade80] flex items-center gap-2">
                  <IconShieldCheck className="w-4 h-4" />
                  <span>Air-Gapped Client-Side Document Sovereignty</span>
                </div>
                <p className="text-[12px] text-[#94a3b8]">
                  Lipi is a client-side web application. It has zero backend application servers or cloud storage buckets.
                </p>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 rounded-lg bg-[#11141e] border border-[#1f2637] space-y-1">
                  <div className="font-semibold text-white">Where is my document processed?</div>
                  <div className="text-[#8e98a8]">
                    Your PDFs and scanned images are decoded directly inside your browser's HTML5 canvas and WebAssembly memory heap. No document bytes are transmitted to any server.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#11141e] border border-[#1f2637] space-y-1">
                  <div className="font-semibold text-white">Where is my Gemini API Key stored?</div>
                  <div className="text-[#8e98a8]">
                    Your API key is saved solely in your local browser's private <code>localStorage</code>. It is never logged or broadcast.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#11141e] border border-[#1f2637] space-y-1">
                  <div className="font-semibold text-white">Does Layer 2 Vision leak my document?</div>
                  <div className="text-[#8e98a8]">
                    Only when you explicitly enable Layer 2 AI and supply an API key does your browser make a direct HTTPS call to Google's official Gemini endpoint. Without Layer 2 enabled, Lipi runs completely air-gapped.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SHORTCUTS & TIPS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">Keyboard Navigation &amp; Productivity</h3>
                <p className="text-[11px] text-[#8e98a8]">
                  Quick shortcuts designed for high-speed document inspection:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-[#121520] border border-[#1e2434] flex items-center justify-between">
                  <span className="text-xs text-[#cbd5e1]">Navigate to Previous Page</span>
                  <kbd className="px-2.5 py-1 rounded bg-[#1c2232] border border-[#2b354d] text-white font-mono text-[11px] shadow-sm">
                    &larr; Left Arrow
                  </kbd>
                </div>

                <div className="p-3 rounded-lg bg-[#121520] border border-[#1e2434] flex items-center justify-between">
                  <span className="text-xs text-[#cbd5e1]">Navigate to Next Page</span>
                  <kbd className="px-2.5 py-1 rounded bg-[#1c2232] border border-[#2b354d] text-white font-mono text-[11px] shadow-sm">
                    &rarr; Right Arrow
                  </kbd>
                </div>

                <div className="p-3 rounded-lg bg-[#121520] border border-[#1e2434] flex items-center justify-between">
                  <span className="text-xs text-[#cbd5e1]">Direct Text Editing</span>
                  <span className="text-[11px] text-[#8e98a8]">Click inside the right transcription panel</span>
                </div>

                <div className="p-3 rounded-lg bg-[#121520] border border-[#1e2434] flex items-center justify-between">
                  <span className="text-xs text-[#cbd5e1]">Parallel Hardware Tuning</span>
                  <span className="text-[11px] text-[#8e98a8]">Adjust worker count in Settings</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-[#1f2536] bg-[#131622] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0 shrink-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#64748b]">
            <IconShieldCheck className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
            <span>Permanent reference available at USER_GUIDE.md</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1c2232] text-white text-xs font-semibold hover:bg-[#252d42] transition-colors cursor-pointer border border-[#2b364e] text-center"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
