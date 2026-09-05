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

export interface TextDiff {
  diffId: string;
  original: string;
  suggested: string;
  reason: string;
  status: 'proposed' | 'accepted' | 'rejected';
  confidenceGain?: number;
  timestamp?: string;
}

export interface PageData {
  pageNumber: number; // 1-indexed
  thumbnailUrl: string; // low-res WebP/JPEG data URL for grid
  highResUrl?: string; // full-res image data URL (cached or rendered on-demand)
  text: string;
  rawOcrText?: string;
  confidence: number; // 0 - 100
  calibratedConfidence?: number; // 0 - 100 (multi-factor calibrated score)
  script?: string; // 'Latin' | 'Devanagari' | 'Mixed' | etc.
  status: PageStatus;
  error?: string;
  isAiRefined: boolean;
  words?: WordData[];
  lineCount: number;
  width?: number;
  height?: number;
  skewAngle?: number;
  dpi?: number;
  needsReview?: boolean;
  reviewFlags?: string[];
  diffs?: TextDiff[];
  sourceType?: 'normal' | 'ai_corrected' | 'gemini_vision';
}

export type DocumentMode = 'printed' | 'handwritten' | 'mixed';

export interface JobConfig {
  language: string; // 'eng' | 'hin' | 'eng+hin' | 'auto'
  documentMode?: DocumentMode; // 'printed' (standard) | 'handwritten' (manuscripts/notes) | 'mixed' (forms)
  enableAiRefinement: boolean;
  geminiApiKey: string;
  modelName?: string; // 'gemini-3.6-flash' | 'gemini-3.6-pro' | etc.
  aiConfidenceThreshold: number; // 0 - 100, e.g. 75
  workerCount: number; // 1 - 16
  autoFitDocx: boolean;
  preprocessScan: boolean; // adaptive contrast stretching & stroke sharpening
}

export const DEFAULT_JOB_CONFIG: JobConfig = {
  language: 'eng+hin',
  documentMode: 'printed',
  enableAiRefinement: true,
  geminiApiKey: '',
  modelName: 'gemini-3.6-flash',
  aiConfidenceThreshold: 75,
  workerCount: 4,
  autoFitDocx: true,
  preprocessScan: true,
};

export interface CanonicalBlockData {
  block_id: string;
  type: 'paragraph' | 'heading' | 'table' | 'handwriting' | 'list_item';
  reading_order: number;
  script: string;
  text: string;
  confidence: number; // 0.0 - 1.0
  bbox?: [number, number, number, number]; // [x0, y0, x1, y1]
  needs_review: boolean;
}

export interface CanonicalPageData {
  page_number: number;
  script?: string;
  confidence: number; // 0 - 100
  is_ai_refined: boolean;
  blocks: CanonicalBlockData[];
}

export interface CanonicalDocumentData {
  document_id: string;
  file_name: string;
  source_page_count: number;
  document_mode: DocumentMode;
  generated_at: string;
  pages: CanonicalPageData[];
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
