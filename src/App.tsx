import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/header/Header';
import { SettingsModal } from './components/header/SettingsModal';
import { UserGuideModal } from './components/guide/UserGuideModal';
import { DropZone } from './components/upload/DropZone';
import { ProgressDashboard } from './components/processing/ProgressDashboard';
import { SideBySideViewer } from './components/viewer/SideBySideViewer';
import { PageGrid } from './components/viewer/PageGrid';
import { ExportBar } from './components/export/ExportBar';
import { AnalyticsModal } from './components/dashboard/AnalyticsModal';
import { Footer } from './components/common/Footer';
import { DocumentJob, JobConfig, PageData } from './types';
import { loadPdfDocument, renderPdfPage, processImageFile, loadTiffDocument } from './core/pdf/pageExtractor';
import { OcrWorkerPool } from './core/ocr/workerPool';
import { refinePageWithAi } from './core/ocr/aiRefiner';
import { calculateCalibratedConfidence, generateContextualDiffs } from './core/ocr/orthographyAgent';
import { generateStrictFidelityDocx } from './core/export/docxExporter';
import { SAMPLE_PAGES, createSamplePageBlob } from './core/utils/sampleData';

const getOptimalWorkerCount = (): number => {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    // Utilize available hardware cores, clamped sensibly between 2 and 16
    return Math.max(2, Math.min(16, navigator.hardwareConcurrency));
  }
  return 4;
};

const DEFAULT_CONFIG: JobConfig = {
  language: 'eng+hin',
  documentMode: 'printed',
  enableAiRefinement: true,
  geminiApiKey: '',
  modelName: 'gemini-3.6-flash',
  aiConfidenceThreshold: 75,
  workerCount: getOptimalWorkerCount(),
  autoFitDocx: true,
  preprocessScan: true,
};

export const App: React.FC = () => {
  const [config, setConfig] = useState<JobConfig>(() => {
    try {
      const saved = localStorage.getItem('lipi_ocr_config') || localStorage.getItem('kalon_ocr_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatic migration of legacy models (PRD §5.2)
        if (parsed.modelName === 'gemini-2.5-flash') {
          parsed.modelName = 'gemini-3.6-flash';
        }
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isBatchRefining, setIsBatchRefining] = useState(false);
  const [job, setJob] = useState<DocumentJob | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [activeWorkers, setActiveWorkers] = useState<number>(0);
  const [isRefiningSinglePage, setIsRefiningSinglePage] = useState(false);

  const workerPoolRef = useRef<OcrWorkerPool | null>(null);
  const isCanceledRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const queueRef = useRef<number[]>([]);
  const processNextPageRef = useRef<(() => Promise<void>) | null>(null);

  // Persist configuration
  const handleSaveConfig = (newConfig: JobConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('lipi_ocr_config', JSON.stringify(newConfig));
    } catch {}
  };

  // Keyboard navigation for pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!job || job.pages.length <= 1) return;
      // Do not navigate if user is typing in textarea or input
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') return;

      if (e.key === 'ArrowLeft') {
        setCurrentPageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPageIndex((prev) => Math.min(job.pages.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [job]);

  /**
   * Main processing pipeline for loaded documents
   */
  const startDocumentProcessing = async (
    fileName: string,
    fileSize: number,
    fileType: string,
    totalPages: number,
    pageFetcher: (pageNumber: number) => Promise<{ thumbnail: string; highResBlob: Blob }>
  ) => {
    isCanceledRef.current = false;

    // Initialize Pages metadata skeleton
    const initialPages: PageData[] = Array.from({ length: totalPages }, (_, i) => ({
      pageNumber: i + 1,
      thumbnailUrl: '',
      text: '',
      confidence: 0,
      status: 'queued',
      isAiRefined: false,
      lineCount: 0,
    }));

    const newJob: DocumentJob = {
      id: `job_${Date.now()}`,
      fileName,
      fileSize,
      fileType,
      totalPages,
      pages: initialPages,
      status: 'processing',
      startTime: Date.now(),
    };

    setJob(newJob);
    setCurrentPageIndex(0);

    // Initialize Worker Pool
    const pool = new OcrWorkerPool(config.workerCount, config.language);
    workerPoolRef.current = pool;

    try {
      await pool.init();
    } catch (err) {
      console.error('Failed to initialize OCR workers:', err);
      alert('Failed to initialize local OCR engine.');
      setJob((prev) => (prev ? { ...prev, status: 'error', error: 'Worker init failed' } : null));
      return;
    }

    // Queue-based parallel processing (PRD §7.2 Resumable Queue)
    queueRef.current = Array.from({ length: totalPages }, (_, i) => i + 1);
    isPausedRef.current = false;
    let activeRunning = 0;

    const processNextPage = async (): Promise<void> => {
      if (queueRef.current.length === 0 || isCanceledRef.current || isPausedRef.current) return;

      const pageNumber = queueRef.current.shift()!;
      const pageIndex = pageNumber - 1;

      // Update status to rendering
      setJob((prev) => {
        if (!prev) return null;
        const updated = [...prev.pages];
        updated[pageIndex] = { ...updated[pageIndex], status: 'rendering' };
        return { ...prev, pages: updated };
      });

      try {
        // Render page just in time (memory efficient)
        const { thumbnail, highResBlob } = await pageFetcher(pageNumber);

        if (isCanceledRef.current) return;

        const pageHighResUrl = URL.createObjectURL(highResBlob);

        setJob((prev) => {
          if (!prev) return null;
          const updated = [...prev.pages];
          updated[pageIndex] = {
            ...updated[pageIndex],
            thumbnailUrl: thumbnail,
            highResUrl: pageHighResUrl,
            status: 'processing',
          };
          return { ...prev, pages: updated };
        });

        activeRunning++;
        setActiveWorkers(activeRunning);

        // Layer 1: Run local WASM OCR with adaptive preprocessing
        const ocrResult = await pool.recognize(highResBlob, {
          preprocess: config.preprocessScan,
          documentMode: config.documentMode,
        });

        let finalText = ocrResult.text;
        let isAiRefined = false;

        // Stages 5 & 6: Orthography Cross-Validation & Contextual Correction Matrix
        const diffs = generateContextualDiffs(ocrResult.text, ocrResult.script);
        const rawCalibrated = calculateCalibratedConfidence(ocrResult.confidence, ocrResult.text, ocrResult.script);

        // Layer 2: AI Refinement — always runs when API key is provided
        if (config.enableAiRefinement && config.geminiApiKey && !isCanceledRef.current && !isPausedRef.current) {
          setJob((prev) => {
            if (!prev) return null;
            const updated = [...prev.pages];
            updated[pageIndex] = {
              ...updated[pageIndex],
              status: 'refining',
              rawOcrText: ocrResult.text,
            };
            return { ...prev, pages: updated };
          });

          const aiResult = await refinePageWithAi({
            apiKey: config.geminiApiKey,
            imageBlobOrBase64: highResBlob,
            rawOcrText: ocrResult.text,
            detectedScript: ocrResult.script,
            pageNumber,
            documentMode: config.documentMode,
            modelName: config.modelName || 'gemini-3.6-flash',
          });

          if (aiResult.success) {
            finalText = aiResult.refinedText;
            isAiRefined = true;
          }
        }

        // Stage 7: QA & Calibrated Confidence Scoring
        const finalCalibrated = isAiRefined
          ? calculateCalibratedConfidence(95, finalText, ocrResult.script)
          : rawCalibrated;

        const sourceType: 'gemini_vision' | 'ai_corrected' | 'normal' = isAiRefined
          ? 'gemini_vision'
          : diffs.length > 0
          ? 'ai_corrected'
          : 'normal';

        // Commit page result to state
        setJob((prev) => {
          if (!prev) return null;
          const updated = [...prev.pages];
          updated[pageIndex] = {
            ...updated[pageIndex],
            text: finalText,
            rawOcrText: ocrResult.text,
            confidence: isAiRefined ? Math.max(92, ocrResult.confidence) : ocrResult.confidence,
            calibratedConfidence: finalCalibrated.calibratedConfidence,
            needsReview: finalCalibrated.needsReview,
            reviewFlags: finalCalibrated.reviewFlags,
            diffs,
            sourceType,
            script: ocrResult.script,
            status: 'done',
            isAiRefined,
            words: ocrResult.words,
            lineCount: finalText.split('\n').length,
            highResUrl: pageHighResUrl,
          };
          return { ...prev, pages: updated };
        });
      } catch (pageErr: any) {
        console.error(`Error processing page ${pageNumber}:`, pageErr);
        setJob((prev) => {
          if (!prev) return null;
          const updated = [...prev.pages];
          updated[pageIndex] = {
            ...updated[pageIndex],
            status: 'failed',
            error: pageErr.message || 'Processing failed',
          };
          return { ...prev, pages: updated };
        });
      } finally {
        activeRunning--;
        setActiveWorkers(activeRunning);
        if (!isCanceledRef.current && !isPausedRef.current && queueRef.current.length > 0) {
          await processNextPage();
        }
      }
    };

    processNextPageRef.current = processNextPage;

    // Spawn concurrent processing workers according to config
    const workerPromises: Promise<void>[] = [];
    const concurrency = Math.min(config.workerCount, totalPages);
    for (let c = 0; c < concurrency; c++) {
      workerPromises.push(processNextPage());
    }

    await Promise.all(workerPromises);

    setJob((prev) => (prev ? { ...prev, status: 'completed', endTime: Date.now() } : null));
    setActiveWorkers(0);
  };

  /**
   * Handles user file selection (PDF or Image)
   */
  const handleFileSelect = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTiff = file.type === 'image/tiff' || file.name.toLowerCase().match(/\.tiff?$/i);

    if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await loadPdfDocument(arrayBuffer);
        const totalPages = pdfDoc.numPages;

        await startDocumentProcessing(
          file.name,
          file.size,
          'pdf',
          totalPages,
          async (pageNumber: number) => {
            const res = await renderPdfPage(pdfDoc, pageNumber, {
              thumbnailScale: 0.35,
              highResScale: 2.0,
              needHighRes: true,
            });
            return {
              thumbnail: res.thumbnailUrl,
              highResBlob: res.highResBlob || new Blob(),
            };
          }
        );
      } catch (err: any) {
        console.error('Failed to load PDF document:', err);
        alert(`Error opening PDF: ${err.message || 'File corrupted or unreadable'}`);
      }
    } else if (isTiff) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const tiffDoc = await loadTiffDocument(arrayBuffer);
        await startDocumentProcessing(
          file.name,
          file.size,
          'tiff',
          tiffDoc.numPages,
          async (pageNumber: number) => {
            const res = await tiffDoc.renderPage(pageNumber);
            return {
              thumbnail: res.thumbnailUrl,
              highResBlob: res.highResBlob || new Blob(),
            };
          }
        );
      } catch (err: any) {
        console.error('Failed to process TIFF document:', err);
        alert(`Error opening TIFF: ${err.message || 'File unreadable'}`);
      }
    } else {
      // Single Image file (JPG, PNG, WebP)
      try {
        const rendered = await processImageFile(file);
        await startDocumentProcessing(
          file.name,
          file.size,
          'image',
          1,
          async () => ({
            thumbnail: rendered.thumbnailUrl,
            highResBlob: rendered.highResBlob || file,
          })
        );
      } catch (err: any) {
        console.error('Failed to process image:', err);
        alert(`Error processing image: ${err.message}`);
      }
    }
  };

  /**
   * Loads the 3-Page Bilingual Demo Specimen
   */
  const handleLoadDemo = async () => {
    await startDocumentProcessing(
      'Lipi_Bilingual_Specimen.pdf',
      420000,
      'pdf',
      SAMPLE_PAGES.length,
      async (pageNumber: number) => {
        const desc = SAMPLE_PAGES[pageNumber - 1];
        const blob = await createSamplePageBlob(desc);
        const thumbUrl = URL.createObjectURL(blob);
        return {
          thumbnail: thumbUrl,
          highResBlob: blob,
        };
      }
    );
  };

  /**
   * Cancels ongoing processing
   */
  const handleCancelProcessing = async () => {
    isCanceledRef.current = true;
    if (workerPoolRef.current) {
      await workerPoolRef.current.terminate();
      workerPoolRef.current = null;
    }
    setActiveWorkers(0);
    setJob((prev) => (prev ? { ...prev, status: 'paused' } : null));
  };

  /**
   * Re-evaluates a single page with Gemini AI vision refinement
   */
  const handleRefineWithAi = async (pageIndex: number) => {
    if (!job || !config.geminiApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const page = job.pages[pageIndex];
    if (!page) return;

    setIsRefiningSinglePage(true);

    try {
      // Blob URLs (blob:http://...) must be fetched first to get the actual Blob.
      const imageUrl = page.highResUrl || page.thumbnailUrl;
      let imageBlob: Blob;
      if (imageUrl.startsWith('blob:') || imageUrl.startsWith('http')) {
        const resp = await fetch(imageUrl);
        imageBlob = await resp.blob();
      } else {
        // data: URL — convert directly
        const byteStr = atob(imageUrl.split(',')[1] || '');
        const mime = imageUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const arr = new Uint8Array(byteStr.length);
        for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
        imageBlob = new Blob([arr], { type: mime });
      }

      const res = await refinePageWithAi({
        apiKey: config.geminiApiKey,
        imageBlobOrBase64: imageBlob,
        rawOcrText: page.rawOcrText || page.text,
        detectedScript: page.script,
        pageNumber: page.pageNumber,
        documentMode: config.documentMode,
        modelName: config.modelName || 'gemini-3.6-flash',
      });

      if (res.success) {
        setJob((prev) => {
          if (!prev) return null;
          const updated = [...prev.pages];
          updated[pageIndex] = {
            ...updated[pageIndex],
            text: res.refinedText,
            isAiRefined: true,
            sourceType: 'gemini_vision',
            confidence: Math.max(95, page.confidence),
            calibratedConfidence: 96,
            needsReview: false,
            reviewFlags: [],
            lineCount: res.refinedText.split('\n').length,
          };
          return { ...prev, pages: updated };
        });
      } else {
        alert(`AI Refinement notice: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Manual AI refinement error:', err);
      alert(`AI refinement error: ${err.message}`);
    } finally {
      setIsRefiningSinglePage(false);
    }
  };

  /**
   * Pauses queue cleanly between pages (PRD §7.2)
   */
  const handlePauseProcessing = () => {
    isPausedRef.current = true;
    setJob((prev) => (prev ? { ...prev, status: 'paused' } : null));
  };

  /**
   * Resumes queue from current page index (PRD §7.2)
   */
  const handleResumeProcessing = () => {
    if (!job || job.status !== 'paused') return;
    isPausedRef.current = false;
    setJob((prev) => (prev ? { ...prev, status: 'processing' } : null));
    const toSpawn = Math.max(1, config.workerCount - activeWorkers);
    for (let i = 0; i < toSpawn; i++) {
      processNextPageRef.current?.();
    }
  };

  /**
   * Partial export of already-completed pages (PRD §7.2 Partial Download)
   */
  const handlePartialExport = async () => {
    if (!job) return;
    const completed = job.pages.filter((p) => p.status === 'done');
    if (completed.length === 0) {
      alert('No pages have finished processing yet.');
      return;
    }
    const blob = await generateStrictFidelityDocx(completed, {
      fileName: `${job.fileName}_Partial_${completed.length}p`,
      autoFit: config.autoFitDocx,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.fileName.replace(/\.[^/.]+$/, '')}_Partial_${completed.length}p.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Batch refinement for all pages requiring attention
   */
  const handleBatchRefineLowConfidence = async () => {
    if (!job || !config.geminiApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const lowConfIndices = job.pages
      .map((p, idx) => (p.status === 'done' && p.confidence < 75 && !p.isAiRefined ? idx : -1))
      .filter((idx) => idx !== -1);

    if (lowConfIndices.length === 0) return;

    setIsBatchRefining(true);

    for (const idx of lowConfIndices) {
      if (isCanceledRef.current) break;
      await handleRefineWithAi(idx);
    }

    setIsBatchRefining(false);
  };

  /**
   * Allows user to edit transcription text directly
   */
  const handleUpdatePageText = (index: number, newText: string) => {
    setJob((prev) => {
      if (!prev) return null;
      const updated = [...prev.pages];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          text: newText,
          lineCount: newText.split('\n').length,
        };
      }
      return { ...prev, pages: updated };
    });
  };

  const handleResetJob = () => {
    if (job?.status === 'processing') {
      handleCancelProcessing();
    }
    setJob(null);
    setCurrentPageIndex(0);
  };

  return (
    <div className="h-screen flex flex-col bg-[#07080c] text-[#f1f5f9] overflow-hidden">
      <Header
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        hasActiveJob={!!job}
        activeWorkersCount={activeWorkers}
      />

      <main className="flex-1 overflow-y-auto flex flex-col">
        {!job ? (
          <div className="flex-1 flex flex-col justify-between min-h-full">
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
              <DropZone
                onFileSelect={handleFileSelect}
                onLoadDemo={handleLoadDemo}
                isProcessing={false}
                documentMode={config.documentMode}
                onDocumentModeChange={(mode) => setConfig({ ...config, documentMode: mode })}
              />
            </div>
            <Footer variant="full" />
          </div>
        ) : (
          <div className="p-2 sm:p-4 space-y-2.5 sm:space-y-4 max-w-7xl mx-auto w-full">
            {/* Real-time Progress & Telemetry (PRD §7.2) */}
            {(job.status === 'processing' || job.status === 'paused') && (
              <ProgressDashboard
                job={job}
                activeWorkers={activeWorkers}
                totalWorkers={config.workerCount}
                onCancel={handleCancelProcessing}
                onPause={handlePauseProcessing}
                onResume={handleResumeProcessing}
                onPartialExport={handlePartialExport}
              />
            )}

            {/* Page Grid Selector */}
            {job.pages.length > 1 && (
              <PageGrid
                pages={job.pages}
                currentPageIndex={currentPageIndex}
                onSelectPage={(idx) => setCurrentPageIndex(idx)}
                onBatchRefineLowConfidence={handleBatchRefineLowConfidence}
                isBatchRefining={isBatchRefining}
                canRefineAi={config.enableAiRefinement && !!config.geminiApiKey}
              />
            )}

            {/* Dedicated Page-by-Page Side-by-Side Viewer */}
            <SideBySideViewer
              pages={job.pages}
              currentPageIndex={currentPageIndex}
              onSelectPage={(idx) => setCurrentPageIndex(idx)}
              onUpdatePageText={handleUpdatePageText}
              onRefineWithAi={handleRefineWithAi}
              isRefining={isRefiningSinglePage}
              config={config}
            />

            {/* Generous bottom clearance spacer */}
            <div className="h-6" />
          </div>
        )}
      </main>

      {/* Docked Export Command Bar at Bottom */}
      {job && (
        <ExportBar
          fileName={job.fileName}
          pages={job.pages}
          config={config}
          job={job}
          onReset={handleResetJob}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLoadDemo={handleLoadDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {job && (
        <AnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          job={job}
          pages={job.pages}
          onSelectPage={(idx) => setCurrentPageIndex(idx)}
        />
      )}
    </div>
  );
};

export default App;
