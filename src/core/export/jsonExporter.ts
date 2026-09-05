import type {
  DocumentJob,
  JobConfig,
  PageData,
  CanonicalBlockData,
  CanonicalPageData,
  CanonicalDocumentData,
  DocumentMode,
} from '../../types/index.ts';

/**
 * Parses raw or AI-refined page text into structured blocks (paragraphs, tables, headings, lists)
 * according to PRD §14 Canonical Intermediate Representation.
 */
export function parseTextIntoBlocks(
  page: PageData,
  pageNumber: number,
  documentMode: DocumentMode = 'printed'
): CanonicalBlockData[] {
  const text = (page.text || '').trim();
  if (!text) {
    return [];
  }

  const lines = text.split('\n');
  const blocks: CanonicalBlockData[] = [];
  let blockIndex = 1;

  let currentTableLines: string[] = [];

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const tableText = currentTableLines.join('\n');
      blocks.push({
        block_id: `p${pageNumber}_b${blockIndex++}`,
        type: 'table',
        reading_order: blocks.length + 1,
        script: page.script || 'Unknown',
        text: tableText,
        confidence: page.calibratedConfidence !== undefined ? page.calibratedConfidence / 100 : Math.round(page.confidence) / 100,
        needs_review: page.needsReview !== undefined ? page.needsReview : page.confidence < 75,
      });
      currentTableLines = [];
    }
  };

  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const paraText = currentParagraphLines.join('\n').trim();
      if (paraText) {
        // Detect if list item
        const isList = /^[-*•]\s|^\d+[\.)]\s/.test(paraText);

        // Detect if heading (starts with # or short standalone title without list prefix)
        const isHeading =
          paraText.startsWith('#') ||
          (!isList && paraText.length < 70 && !paraText.includes('.') && currentParagraphLines.length === 1);

        const type =
          documentMode === 'handwritten'
            ? 'handwriting'
            : isList
            ? 'list_item'
            : isHeading
            ? 'heading'
            : 'paragraph';

        blocks.push({
          block_id: `p${pageNumber}_b${blockIndex++}`,
          type,
          reading_order: blocks.length + 1,
          script: page.script || 'Unknown',
          text: paraText,
          confidence: page.calibratedConfidence !== undefined ? page.calibratedConfidence / 100 : Math.round(page.confidence) / 100,
          needs_review: page.needsReview !== undefined ? page.needsReview : page.confidence < 75,
        });
      }
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is part of a markdown table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph();
      currentTableLines.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    // Blank line indicates paragraph break
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    currentParagraphLines.push(line);
  }

  flushTable();
  flushParagraph();

  return blocks;
}

/**
 * Generates the Canonical Structured JSON export conforming to PRD §14.
 */
export function generateCanonicalStructuredJson(
  job: DocumentJob,
  documentMode: DocumentMode = 'printed'
): Blob {
  const canonicalPages: CanonicalPageData[] = job.pages.map((page) => {
    const blocks = parseTextIntoBlocks(page, page.pageNumber, documentMode);
    return {
      page_number: page.pageNumber,
      script: page.script || 'Unknown',
      confidence: page.confidence || 0,
      is_ai_refined: Boolean(page.isAiRefined),
      blocks,
    };
  });

  const canonicalDoc: CanonicalDocumentData = {
    document_id: job.id,
    file_name: job.fileName,
    source_page_count: job.totalPages,
    document_mode: documentMode,
    generated_at: new Date().toISOString(),
    pages: canonicalPages,
  };

  const jsonString = JSON.stringify(canonicalDoc, null, 2);
  return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
}

/**
 * Generates an Audit & Provenance Manifest log (PRD NFR-8) detailing processing runs,
 * models used, confidence distributions, and page-by-page verification tracking.
 */
export function generateAuditProvenanceManifest(
  job: DocumentJob,
  config: JobConfig
): Blob {
  const completedPages = job.pages.filter((p) => p.status === 'done');
  const avgConfidence =
    completedPages.length > 0
      ? Math.round(
          completedPages.reduce((acc, p) => acc + (p.confidence || 0), 0) / completedPages.length
        )
      : 0;

  const refinedCount = completedPages.filter((p) => p.isAiRefined).length;

  const auditManifest = {
    platform: 'Lipi Engine — On-Device Bharatiya Document Intelligence',
    version: '1.0.0',
    audit_id: `audit_${job.id}_${Date.now()}`,
    document: {
      id: job.id,
      file_name: job.fileName,
      file_size_bytes: job.fileSize,
      file_type: job.fileType,
      total_pages: job.totalPages,
      processed_pages: completedPages.length,
      document_mode: config.documentMode || 'printed',
    },
    engine_configuration: {
      primary_engine: 'Tesseract WebAssembly (Client-Side)',
      configured_language: config.language,
      worker_threads: config.workerCount,
      ai_refinement_enabled: config.enableAiRefinement,
      multimodal_model: config.enableAiRefinement
        ? config.modelName || 'gemini-3.6-flash (Google Gemini AI Studio)'
        : 'None',
      scan_preprocessor_enabled: config.preprocessScan,
      privacy_mode: config.enableAiRefinement ? 'Client-Side + Direct CORS AI Vision' : '100% On-Device Air-Gapped',
    },
    run_metrics: {
      start_time: job.startTime ? new Date(job.startTime).toISOString() : undefined,
      end_time: job.endTime ? new Date(job.endTime).toISOString() : new Date().toISOString(),
      duration_seconds:
        job.startTime && job.endTime
          ? Math.round((job.endTime - job.startTime) / 1000)
          : undefined,
      average_confidence: avgConfidence,
      pages_ai_refined: refinedCount,
      pages_pure_wasm: completedPages.length - refinedCount,
    },
    page_provenance_log: job.pages.map((p) => ({
      page_number: p.pageNumber,
      status: p.status,
      script_detected: p.script || 'Unknown',
      confidence: p.confidence,
      calibrated_confidence: p.calibratedConfidence,
      is_ai_refined: p.isAiRefined,
      line_count: p.lineCount,
      needs_human_review: p.needsReview !== undefined ? p.needsReview : (p.confidence || 0) < 75,
      review_flags: p.reviewFlags || [],
      skew_angle: p.skewAngle,
      has_raw_ocr_backup: Boolean(p.rawOcrText),
      error: p.error || null,
    })),
  };

  const jsonString = JSON.stringify(auditManifest, null, 2);
  return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
}