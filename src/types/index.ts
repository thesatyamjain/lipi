export type PageStatus = 'queued' | 'rendering' | 'processing' | 'refining' | 'done' | 'failed';

export interface WordData {
  text: string;
  confidence: number;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface PageData {
  pageNumber: number; // 1-indexed
  thumbnailUrl: string; // low-res WebP/JPEG data URL for grid
  highResUrl?: string; // full-res image data URL (cached or rendered on-demand)
  text: string;
  rawOcrText?: string;
  confidence: number; // 0 - 100
  script?: string; // 'Latin' | 'Devanagari' | 'Mixed' | etc.
  status: PageStatus;
  error?: string;
  isAiRefined: boolean;
  words?: WordData[];
  lineCount: number;
  width?: number;
  height?: number;
}

export interface JobConfig {
  language: string; // 'eng' | 'hin' | 'eng+hin' | 'auto'
  enableAiRefinement: boolean;
  geminiApiKey: string;
  aiConfidenceThreshold: number; // 0 - 100, e.g. 75
  workerCount: number; // 1 - 16
  autoFitDocx: boolean;
  preprocessScan: boolean; // adaptive contrast stretching & stroke sharpening
}

export interface DocumentJob {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalPages: number;
  pages: PageData[];
  status: 'idle' | 'loading' | 'processing' | 'completed' | 'paused' | 'error';
  startTime?: number;
  endTime?: number;
  pdfArrayBuffer?: ArrayBuffer;
  error?: string;
}

export interface WorkerProgressMessage {
  pageNumber: number;
  progress: number;
  status: string;
}
