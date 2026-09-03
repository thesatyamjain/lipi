import React, { useState, useEffect, useRef } from 'react';
import { PageData, JobConfig } from '../../types';
import {
  IconChevronLeft,
  IconChevronRight,
  IconZoomIn,
  IconZoomOut,
  IconCocktail,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconRotate,
  IconMaximize,
  IconClose,
  IconHand,
  IconBookOpen,
} from '../common/Icons';

interface SideBySideViewerProps {
  pages: PageData[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onUpdatePageText: (index: number, newText: string) => void;
  onRefineWithAi: (index: number) => Promise<void>;
  isRefining: boolean;
  config: JobConfig;
  onOpenGuide?: () => void;
}

export const SideBySideViewer: React.FC<SideBySideViewerProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onUpdatePageText,
  onRefineWithAi,
  isRefining,
  config,
  onOpenGuide,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'page' | 'width' | 'custom'>('page');
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [enhanceContrast, setEnhanceContrast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Hand Move (Pan & Drag) State
  const [isHandToolActive, setIsHandToolActive] = useState<boolean>(true);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fullscreen Pan State
  const [fullscreenPan, setFullscreenPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreenDragging, setIsFullscreenDragging] = useState<boolean>(false);
  const fsDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fsInitialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentPage = pages[currentPageIndex];

  // Reset image errors and pan offsets when switching pages
  useEffect(() => {
    setImageError(false);
    setPanOffset({ x: 0, y: 0 });
    setFullscreenPan({ x: 0, y: 0 });
  }, [currentPageIndex, currentPage?.highResUrl]);

  // Handle ESC to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!currentPage) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPage.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => {
    setFitMode('custom');
    setZoom((prev) => Math.min(prev + 0.25, 3.5));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setZoom((prev) => Math.max(prev - 0.25, 0.3));
  };

  const handleResetZoom = () => {
    setFitMode('page');
    setZoom(1.0);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setFullscreenPan({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRecenter = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsDragging(false);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFsRecenter = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsFullscreenDragging(false);
    setFullscreenPan({ x: 0, y: 0 });
  };

  // Main Viewport Pointer Handlers for Hand Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHandToolActive || e.button !== 0) return;
    // Do not initiate drag if user clicked an interactive control (e.g. Recenter button)
    if ((e.target as HTMLElement).closest('button')) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...panOffset };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: initialPanRef.current.x + dx,
      y: initialPanRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Wheel zoom with Ctrl/Meta or normal wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      setFitMode('custom');
      setZoom((prev) => Math.min(3.5, Math.max(0.3, Number((prev + delta).toFixed(2)))));
    }
  };

  // Fullscreen Pointer Handlers
  const handleFsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsFullscreenDragging(true);
    fsDragStartRef.current = { x: e.clientX, y: e.clientY };
    fsInitialPanRef.current = { ...fullscreenPan };
  };

  const handleFsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFullscreenDragging) return;
    const dx = e.clientX - fsDragStartRef.current.x;
    const dy = e.clientY - fsDragStartRef.current.y;
    setFullscreenPan({
      x: fsInitialPanRef.current.x + dx,
      y: fsInitialPanRef.current.y + dy,
    });
  };

  const handleFsPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFullscreenDragging) {
      setIsFullscreenDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const wordCount = currentPage.text.trim() ? currentPage.text.trim().split(/\s+/).length : 0;
  const charCount = currentPage.text.length;
  const imageUrl = currentPage.highResUrl || currentPage.thumbnailUrl;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Top Page Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0f16] border border-[#1e2333] p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-1.5 rounded-lg border border-[#242a3c] bg-[#141722] text-[#94a3b8] hover:text-white hover:border-[#38425d] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <IconChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Dropdown selector */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[#8e98a8]">Page</span>
            <select
              value={currentPageIndex}
              onChange={(e) => onSelectPage(parseInt(e.target.value, 10))}
              className="bg-[#141724] border border-[#272e42] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#c59b27] cursor-pointer"
            >
              {pages.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.pageNumber} of {pages.length}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onSelectPage(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="p-1.5 rounded-lg border border-[#242a3c] bg-[#141722] text-[#94a3b8] hover:text-white hover:border-[#38425d] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Confidence & Script Badges */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-md bg-[#141824] border border-[#242b3d] text-[#94a3b8]">
            Script: <strong className="text-white">{currentPage.script || 'Latin'}</strong>
          </span>

          <span
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
              currentPage.confidence >= 80
                ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                : currentPage.confidence >= 65
                ? 'bg-[#facc15]/10 border-[#facc15]/30 text-[#facc15]'
                : 'bg-[#f87171]/10 border-[#f87171]/30 text-[#f87171]'
            }`}
          >
            {currentPage.confidence < 75 && <IconAlertTriangle className="w-3 h-3" />}
            <span>Confidence: {currentPage.confidence}%</span>
          </span>

          {currentPage.isAiRefined && (
            <span className="px-2.5 py-1 rounded-md bg-[#c59b27]/15 border border-[#c59b27]/40 text-[#f6d26d] flex items-center gap-1.5 font-semibold">
              <IconCocktail className="w-3.5 h-3.5" />
              <span>AI Refined</span>
            </span>
          )}
        </div>

        {/* Actions for current page */}
        <div className="flex items-center gap-2">
          {currentPage.rawOcrText && currentPage.isAiRefined && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                showDiff
                  ? 'bg-[#c59b27]/20 border-[#c59b27] text-white'
                  : 'bg-[#141724] border-[#252c3f] text-[#94a3b8] hover:text-white'
              }`}
            >
              {showDiff ? 'Hide Base Diff' : 'Compare with Base'}
            </button>
          )}

          <button
            onClick={() => onRefineWithAi(currentPageIndex)}
            disabled={isRefining || !config.geminiApiKey}
            className="px-3 py-1.5 rounded-lg bg-[#c59b27]/10 border border-[#c59b27]/30 text-[#f3cb59] text-xs font-semibold hover:bg-[#c59b27]/20 hover:border-[#c59b27] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            title={
              config.geminiApiKey
                ? 'Execute multimodal Gemini Flash refinement on this page'
                : 'Configure Gemini API key in Settings to activate AI refinement'
            }
          >
            <IconCocktail className="w-3.5 h-3.5" />
            <span>{isRefining ? 'Refining with AI...' : 'Refine with AI'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-[#242a3c] bg-[#141722] text-[#94a3b8] hover:text-white hover:border-[#38425d] transition-colors cursor-pointer"
            title="Copy Page Text to Clipboard"
          >
            {copied ? <IconCheck className="w-4 h-4 text-[#4ade80]" /> : <IconCopy className="w-4 h-4" />}
          </button>

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="p-1.5 rounded-lg border border-[#242a3c] bg-[#141722] text-[#94a3b8] hover:text-[#c59b27] hover:border-[#c59b27]/40 transition-colors cursor-pointer"
              title="Open User Guide & Shortcuts"
            >
              <IconBookOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Side-by-Side Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[680px]">
        {/* Left Pane: Original Page Scan */}
        <div className="flex flex-col bg-[#0b0d14] border border-[#1e2333] rounded-xl overflow-hidden shadow-2xl">
          {/* Pane Header: Enhanced Preview Toolbar with Hand Move */}
          <div className="px-4 py-2.5 border-b border-[#1c2130] bg-[#11141e] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] font-mono">
                Scan Preview
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181d2a] text-[#718096] border border-[#252c3e]">
                P. {currentPage.pageNumber}
              </span>
            </div>

            {/* View Mode, Hand Tool, Zoom, Rotate, and Fullscreen Controls */}
            <div className="flex items-center gap-1.5">
              {/* Hand Move Tool Toggle */}
              <button
                onClick={() => setIsHandToolActive(!isHandToolActive)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer border ${
                  isHandToolActive
                    ? 'bg-[#c59b27]/20 border-[#c59b27] text-white shadow-sm font-semibold'
                    : 'border-[#232a3c] text-[#8e98a8] hover:text-white'
                }`}
                title="Hand Tool: Click and drag to move page scan around freely"
              >
                <IconHand className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>Hand Move</span>
              </button>

              {/* Fit Mode Toggle */}
              <button
                onClick={() => {
                  setFitMode('page');
                  setZoom(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  fitMode === 'page'
                    ? 'bg-[#1e2434] text-white border border-[#2f3850]'
                    : 'text-[#8e98a8] hover:text-white'
                }`}
                title="Fit full page inside viewport"
              >
                Fit Page
              </button>

              <button
                onClick={() => {
                  setFitMode('width');
                  setZoom(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  fitMode === 'width'
                    ? 'bg-[#1e2434] text-white border border-[#2f3850]'
                    : 'text-[#8e98a8] hover:text-white'
                }`}
                title="Fit page to width"
              >
                Fit Width
              </button>

              {/* Recenter button in toolbar */}
              {(Math.abs(panOffset.x) > 1 || Math.abs(panOffset.y) > 1) && (
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer bg-[#c59b27]/20 border border-[#c59b27] text-[#f6d26d] hover:bg-[#c59b27]/30 hover:text-white flex items-center gap-1 shadow-sm"
                  title="Recenter document position back to center"
                >
                  <span>Recenter</span>
                </button>
              )}

              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1a1f2e] cursor-pointer"
                title="Zoom Out"
              >
                <IconZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Zoom percentage / Reset */}
              <button
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono text-[#94a3b8] hover:text-white hover:bg-[#1a1f2e] cursor-pointer min-w-[42px] text-center"
                title="Reset Zoom, Position & Rotation"
              >
                {Math.round(zoom * 100)}%
              </button>

              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1a1f2e] cursor-pointer"
                title="Zoom In"
              >
                <IconZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Rotate 90 deg */}
              <button
                onClick={handleRotate}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  rotation !== 0
                    ? 'text-[#c59b27] bg-[#c59b27]/10'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#1a1f2e]'
                }`}
                title="Rotate Clockwise 90°"
              >
                <IconRotate className="w-3.5 h-3.5" />
              </button>

              {/* Contrast Filter Toggle */}
              <button
                onClick={() => setEnhanceContrast(!enhanceContrast)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                  enhanceContrast
                    ? 'bg-[#c59b27]/15 border-[#c59b27]/40 text-[#f5cd5a]'
                    : 'border-[#232a3b] text-[#718096] hover:text-[#cbd5e1]'
                }`}
                title="Toggle High-Contrast Filter for faded photocopy scans"
              >
                Contrast
              </button>

              {/* Fullscreen Expand */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1a1f2e] cursor-pointer"
                title="Expand Scan Fullscreen"
              >
                <IconMaximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pane Body: Scalable Canvas Image Viewport with 2D Hand Pan Drag */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`flex-1 overflow-hidden p-4 flex items-center justify-center bg-[#07080c]/70 relative select-none ${
              isHandToolActive ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            style={{ touchAction: 'none' }}
          >
            {imageUrl && !imageError ? (
              <div
                className={`flex items-center justify-center ${
                  isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
                } ${
                  fitMode === 'page'
                    ? 'w-full h-full'
                    : fitMode === 'width'
                    ? 'w-full'
                    : 'w-auto'
                }`}
                style={{
                  transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Page ${currentPage.pageNumber}`}
                  draggable={false}
                  onError={() => setImageError(true)}
                  style={{
                    filter: enhanceContrast ? 'contrast(1.3) brightness(1.02)' : 'none',
                    pointerEvents: 'none',
                    ...(fitMode === 'custom'
                      ? {
                          width: `${Math.round(zoom * 100)}%`,
                          maxWidth: 'none',
                        }
                      : {}),
                  }}
                  className={`rounded shadow-2xl border border-[#242a3c] transition-all duration-150 select-none ${
                    fitMode === 'page'
                      ? 'max-h-full max-w-full object-contain'
                      : fitMode === 'width'
                      ? 'w-full h-auto object-contain'
                      : 'h-auto'
                  }`}
                />
              </div>
            ) : imageError ? (
              <div className="text-center p-6 space-y-2">
                <IconAlertTriangle className="w-8 h-8 text-[#facc15] mx-auto opacity-75" />
                <div className="text-xs text-white font-medium">Scan preview unavailable</div>
                <p className="text-[11px] text-[#64748b]">
                  The page image could not be loaded into canvas.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-[#64748b]">
                <div className="w-6 h-6 border-2 border-[#c59b27] border-t-transparent rounded-full animate-spin" />
                <span>Loading page scan...</span>
              </div>
            )}

            {/* Hand Move active floating recenter pill */}
            {(Math.abs(panOffset.x) > 3 || Math.abs(panOffset.y) > 3) && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={handleRecenter}
                className="absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-lg bg-[#0e111a]/95 border border-[#c59b27] text-xs font-mono text-white hover:bg-[#c59b27] hover:text-black transition-all cursor-pointer shadow-2xl flex items-center gap-1.5 backdrop-blur-md font-semibold"
                title="Recenter page scan position"
              >
                <span>&bull; Recenter Position</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Pane: Extracted Text Editor */}
        <div className="flex flex-col bg-[#0b0d14] border border-[#1e2333] rounded-xl overflow-hidden shadow-2xl">
          {/* Pane Header */}
          <div className="px-4 py-2.5 border-b border-[#1c2130] bg-[#11141e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] font-mono">
                Extracted Transcription
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181d2a] text-[#8e98a8]">
                Editable
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#78859b]">
              {wordCount} words &bull; {charCount} characters
            </div>
          </div>

          {/* Pane Body: Editable Textarea or Diff View */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden bg-[#0a0c12]">
            {showDiff && currentPage.rawOcrText ? (
              <div className="flex-1 flex flex-col space-y-2 overflow-y-auto">
                <div className="text-xs text-[#8e98a8] font-mono mb-1">
                  Comparing Raw Base OCR (left) vs AI Refined Transcription (right):
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="p-3 bg-[#131620] border border-[#242b3d] rounded-lg text-xs font-mono text-[#94a3b8] overflow-auto whitespace-pre-wrap">
                    <div className="text-[10px] text-[#f87171] uppercase font-bold mb-2">
                      Base WASM OCR
                    </div>
                    {currentPage.rawOcrText}
                  </div>
                  <div className="p-3 bg-[#131620] border border-[#c59b27]/30 rounded-lg text-xs font-mono text-[#f1f5f9] overflow-auto whitespace-pre-wrap">
                    <div className="text-[10px] text-[#4ade80] uppercase font-bold mb-2">
                      Gemini Vision Refined
                    </div>
                    {currentPage.text}
                  </div>
                </div>
              </div>
            ) : (
              <textarea
                value={currentPage.text}
                onChange={(e) => onUpdatePageText(currentPageIndex, e.target.value)}
                placeholder="Extracting text for this page..."
                className="w-full flex-1 bg-transparent text-sm text-[#e2e8f0] leading-relaxed font-sans resize-none focus:outline-none placeholder-[#475569] selection:bg-[#c59b27]/30"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL WITH 2D HAND PAN */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-150">
          {/* Lightbox Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#202739] px-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white font-mono">
                Full-Resolution Scan &mdash; Page {currentPage.pageNumber}
              </span>
              <span className="text-xs font-mono text-[#8e98a8]">
                {Math.round(zoom * 100)}% {rotation !== 0 && `(${rotation}°)`}
              </span>
              <span className="text-[11px] font-mono text-[#c59b27] bg-[#c59b27]/10 px-2 py-0.5 rounded border border-[#c59b27]/20">
                ✋ Drag with mouse to move
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRotate}
                className="p-1.5 rounded-lg bg-[#141824] border border-[#232b3d] text-white hover:text-[#c59b27] transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <IconRotate className="w-4 h-4" />
              </button>

              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-[#141824] border border-[#232b3d] text-white hover:text-[#c59b27] transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <IconZoomOut className="w-4 h-4" />
              </button>

              {/* Fullscreen Recenter button */}
              {(Math.abs(fullscreenPan.x) > 1 || Math.abs(fullscreenPan.y) > 1) && (
                <button
                  type="button"
                  onClick={handleFsRecenter}
                  className="px-2.5 py-1 rounded-lg bg-[#c59b27]/20 border border-[#c59b27] text-xs font-mono text-[#f6d26d] hover:bg-[#c59b27]/30 hover:text-white transition-colors cursor-pointer"
                  title="Recenter Fullscreen Scan"
                >
                  Recenter
                </button>
              )}

              <button
                onClick={handleResetZoom}
                className="px-2.5 py-1 rounded-lg bg-[#141824] border border-[#232b3d] text-xs font-mono text-white hover:text-[#c59b27] transition-colors cursor-pointer"
                title="Reset Zoom & Pan"
              >
                Reset
              </button>

              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-[#141824] border border-[#232b3d] text-white hover:text-[#c59b27] transition-colors cursor-pointer"
                title="Zoom In"
              >
                <IconZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-[#1c2232] text-[#94a3b8] hover:text-white transition-colors cursor-pointer ml-2"
                title="Close Fullscreen (Esc)"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Viewport with Hand Pan Drag */}
          <div
            onPointerDown={handleFsPointerDown}
            onPointerMove={handleFsPointerMove}
            onPointerUp={handleFsPointerUp}
            onPointerCancel={handleFsPointerUp}
            className={`flex-1 overflow-hidden p-6 flex items-center justify-center select-none relative ${
              isFullscreenDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ touchAction: 'none' }}
          >
            {imageUrl && (
              <div
                style={{
                  transform: `translate3d(${fullscreenPan.x}px, ${fullscreenPan.y}px, 0) rotate(${rotation}deg)`,
                }}
                className={`flex items-center justify-center ${
                  isFullscreenDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={`Page ${currentPage.pageNumber}`}
                  draggable={false}
                  style={{
                    filter: enhanceContrast ? 'contrast(1.3) brightness(1.02)' : 'none',
                    pointerEvents: 'none',
                    width: fitMode === 'custom' ? `${Math.round(zoom * 100)}%` : undefined,
                  }}
                  className={`rounded shadow-2xl border border-[#2b354c] max-h-full max-w-full object-contain select-none`}
                />
              </div>
            )}

            {/* Fullscreen floating recenter pill */}
            {(Math.abs(fullscreenPan.x) > 3 || Math.abs(fullscreenPan.y) > 3) && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={handleFsRecenter}
                className="absolute bottom-6 right-6 z-20 px-3.5 py-2 rounded-lg bg-[#0e111a]/95 border border-[#c59b27] text-xs font-mono text-white hover:bg-[#c59b27] hover:text-black transition-all cursor-pointer shadow-2xl flex items-center gap-1.5 backdrop-blur-md font-semibold"
                title="Recenter fullscreen scan position"
              >
                <span>&bull; Recenter Position</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
