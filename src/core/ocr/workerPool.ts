import { createWorker, Worker, PSM } from 'tesseract.js';
import { WordData, DocumentMode } from '../../types/index.ts';
import { detectScriptFromText } from './languageDetector.ts';
import { resolveTesseractLang } from './bharatiyaLanguages.ts';
import { preprocessImageForOcr } from './imagePreprocessor.ts';
import { postProcessIndicText } from './indicPostProcessor.ts';

export interface RecognizeResult {
  text: string;
  confidence: number;
  words: WordData[];
  script: string;
}

export class OcrWorkerPool {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private concurrency: number;
  private currentLanguage: string;
  private isInitialized = false;
  private isTerminating = false;

  constructor(concurrency: number = 4, language: string = 'eng+hin') {
    this.concurrency = Math.max(1, Math.min(concurrency, 16));
    this.currentLanguage = language;
  }

  /**
   * Initializes the pool with the target number of Tesseract workers
   */
  async init(onProgress?: (index: number, total: number) => void): Promise<void> {
    if (this.isInitialized) return;

    this.workers = [];
    this.idleWorkers = [];

    const resolvedLang = resolveTesseractLang(this.currentLanguage);

    // Initialize workers with proper logger & parameters
    for (let i = 0; i < this.concurrency; i++) {
      try {
        const worker = await createWorker(resolvedLang, 1, {
          // Use standard CDN for worker and core scripts
          logger: () => {},
        });

        // Set optimized OCR parameters: 300 DPI + interword spaces + PSM AUTO (layout analysis)
        // PSM.AUTO (3) runs region segmentation before recognition — essential for tables and
        // mixed layouts. PSM.SINGLE_BLOCK destroys column detection in tabular documents.
        await worker.setParameters({
          user_defined_dpi: '300',
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: PSM.AUTO,
        });

        this.workers.push(worker);
        this.idleWorkers.push(worker);
        onProgress?.(i + 1, this.concurrency);
      } catch (err) {
        console.warn(`Failed to initialize worker ${i + 1}:`, err);
        // If at least 1 worker succeeded, we can proceed
        if (this.workers.length > 0) break;
        throw err;
      }
    }

    this.isInitialized = true;
  }

  /**
   * Acquires an idle worker, waiting if all are busy
   */
  private async acquireWorker(): Promise<Worker> {
    while (this.idleWorkers.length === 0) {
      if (this.isTerminating) throw new Error('Worker pool is terminating');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return this.idleWorkers.pop()!;
  }

  /**
   * Releases worker back to idle pool
   */
  private releaseWorker(worker: Worker): void {
    if (!this.isTerminating) {
      this.idleWorkers.push(worker);
    }
  }

  /**
   * Performs OCR on an image source (Blob, HTMLCanvasElement, or data URL)
   */
  async recognize(
    imageSource: Blob | string | HTMLCanvasElement,
    options: { preprocess?: boolean; documentMode?: DocumentMode } = {}
  ): Promise<RecognizeResult> {
    const worker = await this.acquireWorker();
    try {
      let sourceToProcess = imageSource;
      if (options.preprocess !== false && typeof window !== 'undefined') {
        try {
          sourceToProcess = await preprocessImageForOcr(imageSource, {
            contrastStretch: true,
            sharpen: true,
            documentMode: options.documentMode,
          });
        } catch (err) {
          console.warn('Image preprocessing skipped, fallback to raw source:', err);
        }
      }

      const { data } = await worker.recognize(sourceToProcess);
      const rawWords = (data as any).words || [];
      
      const words: WordData[] = rawWords.map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox
          ? {
              x0: w.bbox.x0,
              y0: w.bbox.y0,
              x1: w.bbox.x1,
              y1: w.bbox.y1,
            }
          : undefined,
      }));

      const rawText = data.text || '';
      const text = postProcessIndicText(rawText);
      const scriptInfo = detectScriptFromText(text);

      return {
        text,
        confidence: Math.round(data.confidence || 0),
        words,
        script: scriptInfo.primaryScript,
      };
    } finally {
      this.releaseWorker(worker);
    }
  }

  /**
   * Reinitializes with a different language if user changes settings
   */
  async changeLanguage(newLang: string): Promise<void> {
    if (newLang === this.currentLanguage) return;
    await this.terminate();
    this.currentLanguage = newLang;
    await this.init();
  }

  /**
   * Terminates all workers and cleans up resources
   */
  async terminate(): Promise<void> {
    this.isTerminating = true;
    const workersToTerminate = [...this.workers];
    this.workers = [];
    this.idleWorkers = [];
    this.isInitialized = false;

    await Promise.allSettled(workersToTerminate.map((w) => w.terminate()));
    this.isTerminating = false;
  }
}
