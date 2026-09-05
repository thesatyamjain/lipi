/**
 * Layer 2 AI Refinement Engine
 * Uses Gemini 2.5 Flash multimodal vision API for context-aware OCR correction,
 * layout reconstruction, and Indic/Devanagari script recovery.
 */

import { postProcessIndicText } from './indicPostProcessor.ts';
import type { DocumentMode } from '../../types/index.ts';

export interface AiRefineOptions {
  apiKey: string;
  imageBlobOrBase64: Blob | string;
  rawOcrText: string;
  detectedScript?: string;
  pageNumber?: number;
  documentMode?: DocumentMode;
  modelName?: string;
}

export interface AiRefineResult {
  refinedText: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

/**
 * Converts a Blob to a base64 string without data prefix
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Executes Layer 2 AI refinement on a single page
 */
export async function refinePageWithAi(options: AiRefineOptions): Promise<AiRefineResult> {
  const {
    apiKey,
    imageBlobOrBase64,
    rawOcrText,
    detectedScript,
    pageNumber,
    documentMode = 'printed',
  } = options;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      refinedText: rawOcrText,
      success: false,
      error: 'Google Gemini API key is required for AI refinement.',
      modelUsed: 'none',
    };
  }

  try {
    let base64Image = '';
    let mimeType = 'image/jpeg';

    if (typeof imageBlobOrBase64 === 'string') {
      if (imageBlobOrBase64.startsWith('data:')) {
        const matches = imageBlobOrBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Image = matches[2];
        } else {
          base64Image = imageBlobOrBase64.split(',')[1] || imageBlobOrBase64;
        }
      } else {
        base64Image = imageBlobOrBase64;
      }
    } else {
      mimeType = imageBlobOrBase64.type || 'image/jpeg';
      base64Image = await blobToBase64(imageBlobOrBase64);
    }

    const systemInstructions = `You are an expert OCR transcription and document restoration engine specializing in Indian government documents, legal papers, financial records, manuscripts, and mixed-script layouts.
Your task is to transcribe and accurately reconstruct the text from the provided document page image.
You are given the page image along with an initial rough OCR draft from a base WASM engine (which may be garbled or misaligned — use it only as a hint, trust the image).

RULES:

1. CHARACTER CORRECTION: Examine the image carefully. Correct any misrecognized characters, broken words, substituted glyphs, or OCR artifacts from the base draft.

2. INDIC SCRIPTS, SHIROREKHA & CONJUNCTS:
   a. Pay special attention to all 22 official Bharatiya languages — Devanagari (Hindi, Marathi, Sanskrit, Nepali, Bodo, Dogri, Konkani, Maithili), Bengali/Assamese (Bengali, Assamese, Manipuri), Dravidian (Tamil, Telugu, Kannada, Malayalam), Gujarati, Gurmukhi (Punjabi), Odia, Perso-Arabic (Urdu, Kashmiri, Sindhi), Ol Chiki (Santali).
   b. SHIROREKHA (HEADLINE) CONTINUITY: Degraded scans and photocopies frequently show faint or broken shirorekhas. Do NOT allow broken headline lines to falsely split a single grammatical word into disconnected letters or syllables. Always reconstruct the complete word based on contextual grammar and spelling.
   c. SAMYUKTAKSHARAS (CONJUNCTS): Base OCR engines often fail on conjuncts (e.g. क्ष, त्र, ज्ञ, द्ध, द्य, प्र, क्र, ष्ट, ष्ण, न्न). Reconstruct accurate ligatures and conjuncts from visual geometry and linguistic context.
   d. 4-WAY MATRAS & DIACRITICS: Correctly restore vowel diacritics in all four anatomical zones (top: ि, ी, े, ै, anusvara ं, candrabindu ँ; bottom: ु, ू, ृ, halant ्; right: ा, ो, ौ, visarga ः). Never drop or confuse short/long vowels in legal or official terms.
   e. NUMERALS: Preserve Indic numerals (०-९, ০-৯, ੦-੯, etc.) exactly as they appear in stamps, dates, or serials; do not arbitrarily convert between regional and Latin digits.

3. TABLES & GRIDS — CRITICAL:
   a. DETECTION: If the page contains ANY tabular structure (ruled lines, aligned columns, balance sheets, invoices, mark sheets, schedules, registers, forms with boxes), you MUST format it as a Markdown table.
   b. SYNTAX: Use standard pipe-separated Markdown: | Cell | Cell | Cell |
   c. HEADER ROW: Always output a separator row after the header: | --- | --- | --- | (one --- per column, matching the exact column count).
   d. COLUMN COUNT: Every single row in a table MUST have the SAME number of pipe characters. Count columns from the header row and maintain that count throughout — including for empty cells.
   e. EMPTY CELLS: If a cell is blank or empty in the image, output an empty cell: |  | (two spaces between pipes, not omitted).
   f. MERGED CELLS (colspan): If a cell spans multiple columns visually, repeat its content in each merged column position or use a clear placeholder like | ← merged | for continuation columns.
   g. MULTI-LINE CELLS: If a cell contains multiple lines of text, join them with a space within the single table cell. Do NOT split one cell into multiple rows.
   h. DO NOT MERGE ROWS: Each physical row in the image = exactly one row in the Markdown table. Never collapse two image rows into one.
   i. NUMERIC COLUMNS: Preserve exact formatting of numbers, currency (₹, $, Rs.), percentages, and dates as they appear — do not reformat.
   j. BORDERLESS TABLES: Even if no visible grid lines exist, if content is clearly in aligned columns (e.g. a ledger, list with amounts), still format as a Markdown table.
   k. AFTER TABLE: Any text appearing below a table (footnotes, signatures, page numbers) should appear after the table, outside it, as plain text.

4. NUMERICAL & LEGAL FIDELITY: Preserve exact case numbers, section codes (e.g. "Section 138", "IPC 302", "Act 1872"), serial numbers, dates, currency amounts, and mathematical figures. Zero hallucination tolerance for numbers.

5. BILINGUAL PRESERVATION: Maintain both English headers/terms and regional Indic passages exactly as written — do not translate, transliterate, or reorder.

6. READING ORDER: Preserve natural reading order across multi-column layouts. For two-column pages, complete left column first, then right column.

7. SEALS & STAMPS: Transcribe readable rubber stamp / official seal text as [Seal: <text>] or [Stamp: <text>].

8. HANDWRITING, MANUSCRIPTS & FORMS (${documentMode === 'handwritten' ? 'ACTIVE - HIGHEST PRIORITY' : documentMode === 'mixed' ? 'MIXED FORM MODE' : 'IF APPLICABLE'}):
   a. UNCONSTRAINED HANDWRITING: When handwriting is present (or in handwriting mode), human writing exhibits variable stroke slant, irregular character height, and omitted or wavy shirorekhas. Decipher cursive Devanagari/regional strokes by integrating whole-word grammar and sentence semantics.
   b. MARGINALIA & CORRECTIONS: If there are handwritten margin notes, transcribe them in reading order as [Margin note: <text>].
   c. STRIKETHROUGHS: If text has been crossed out or corrected by pen, transcribe as [Crossed out: <text>] followed by the handwritten replacement.
   d. FAINT PENCIL / INK BLEED: Decipher low-contrast ballpoint, fountain pen, or pencil strokes carefully. Use [illegible] only if ink is completely destroyed.
   e. MIXED FORMS: For printed forms with handwritten user entries, output each field clearly: e.g. "Name / नाम: <handwritten text>".

9. OUTPUT FORMAT: Output ONLY the document text. No preambles ("Here is the transcription..."), no greetings, no markdown code fences (\`\`\`), no commentary.`;

    const userPrompt = `Page Number: ${pageNumber || 1}
Detected Script: ${detectedScript || 'Auto-detect'}
Document Mode: ${documentMode === 'handwritten' ? 'Handwritten / Manuscript (हस्तलिखित)' : documentMode === 'mixed' ? 'Mixed Form (Printed + Handwritten)' : 'Printed / Typeset'}

Initial Rough Base OCR Draft (use as hint only — prioritize the image):
---
${rawOcrText || '[No base text detected — transcribe entirely from the image]'}
---`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: `${systemInstructions}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 16384,
        // Disable chain-of-thought for OCR transcription — saves ~1-2s per page
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    // PRD §5.2 Model Hierarchy with automatic migration of deprecated models
    const requestedModel = options.modelName === 'gemini-2.5-flash' ? 'gemini-3.6-flash' : options.modelName;

    const baseHierarchy = [
      'gemini-3.6-flash',
      'gemini-3.6-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];

    const candidateModels = requestedModel
      ? [requestedModel, ...baseHierarchy.filter((m) => m !== requestedModel)]
      : baseHierarchy;

    let lastErrorMsg = '';
    let candidateResult: AiRefineResult | null = null;

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.error?.message || `API request failed with status ${response.status}`;
          lastErrorMsg = msg;

          const lowerMsg = msg.toLowerCase();
          // If model is discontinued, not found, or not available to new users, try the next fallback model
          if (
            response.status === 404 ||
            lowerMsg.includes('no longer available') ||
            lowerMsg.includes('not found') ||
            lowerMsg.includes('not supported') ||
            lowerMsg.includes('is not available')
          ) {
            console.warn(`Gemini model ${modelName} returned availability error: "${msg}". Falling back to next model...`);
            continue;
          }

          // If it's a hard error (invalid API key, quota exceeded, etc.), stop trying other models
          throw new Error(msg);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const textPart = candidate?.content?.parts?.[0]?.text;

        if (!textPart || textPart.trim().length === 0) {
          throw new Error('AI model returned an empty transcription.');
        }

        // Clean any accidental markdown wrap
        let cleanedText = textPart.trim();
        if (cleanedText.startsWith('```markdown')) {
          cleanedText = cleanedText.replace(/^```markdown\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```[a-z]*\s*/, '').replace(/\s*```$/, '');
        }

        candidateResult = {
          refinedText: postProcessIndicText(cleanedText),
          success: true,
          modelUsed: modelName,
        };
        break;
      } catch (err: any) {
        lastErrorMsg = err.message || 'AI refinement failed';
        const lower = lastErrorMsg.toLowerCase();
        if (
          lower.includes('api_key_invalid') ||
          lower.includes('api key not valid') ||
          lower.includes('quota') ||
          lower.includes('permission')
        ) {
          throw err;
        }
      }
    }

    if (candidateResult) {
      return candidateResult;
    }

    throw new Error(lastErrorMsg || 'All candidate Gemini models were unavailable.');
  } catch (err: any) {
    console.error('AI refinement error:', err);
    return {
      refinedText: rawOcrText,
      success: false,
      error: err.message || 'AI refinement failed',
      modelUsed: 'failed',
    };
  }
}
