/**
 * Layer 2 AI Refinement Engine
 * Uses Gemini 2.5 Flash multimodal vision API for context-aware OCR correction,
 * layout reconstruction, and Indic/Devanagari script recovery.
 */

export interface AiRefineOptions {
  apiKey: string;
  imageBlobOrBase64: Blob | string;
  rawOcrText: string;
  detectedScript?: string;
  pageNumber?: number;
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
  const { apiKey, imageBlobOrBase64, rawOcrText, detectedScript, pageNumber } = options;

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

    const systemInstructions = `You are an expert OCR transcription and document restoration engine.
Your task is to transcribe and accurately reconstruct the text from the provided document page image.
You are given the page image along with an initial rough OCR draft from a base WASM engine.

Rules:
1. Examine the page image carefully. Correct any misrecognized characters, spelling mistakes, garbled letters, or broken words in the base OCR.
2. Pay special attention to all 22 official Bharatiya (Indian) languages and scripts — Devanagari (Hindi, Marathi, Sanskrit, Nepali, Bodo, Dogri, Konkani, Maithili), Bengali & Assamese (Bengali, Assamese, Manipuri), Dravidian scripts (Tamil, Telugu, Kannada, Malayalam), Gujarati, Gurmukhi (Punjabi), Odia, Perso-Arabic (Urdu, Kashmiri, Sindhi), and Ol Chiki (Santali). Correctly restore complex ligatures, matras (vowel diacritics), halants/viramas, nuktas, anusvaras, conjunct consonants (samyuktaksharas), and preserve both regional Indic numerals (०-९, ০-৯, etc.) and Latin digits.
3. Tabular & Grid Layout: If the page contains tables, schedules, balance sheets, invoices, or forms, format them as structured Markdown tables (| Col 1 | Col 2 |) to preserve column and row alignments.
4. Numerical & Legal Fidelity: Preserve exact case numbers, section codes (e.g. "Section 138", "Act 1872"), serial numbers, dates, currency symbols (₹, $, etc.), and mathematical figures without hallucination or alteration.
5. Bilingual Preservation: Maintain both English headers/terms and regional Indic passages exactly as written without translating or transliterating.
6. Seals & Annotations: If official rubber stamps or seals contain readable text, clearly transcribe them as [Seal/Stamp: <text>].
7. Preserve the natural reading order across multi-column layouts, paragraphs, and lists.
8. Output STRICTLY the extracted text of the document page. Do NOT include conversational preambles (e.g. "Here is the text"), greetings, or markdown code fences like \`\`\`text.`;

    const userPrompt = `Page Number: ${pageNumber || 1}
Detected Script: ${detectedScript || 'Auto-detect'}

Initial Rough Base OCR Draft:
---
${rawOcrText || '[No base text detected]'}
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
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    };

    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];

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
          refinedText: cleanedText,
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
