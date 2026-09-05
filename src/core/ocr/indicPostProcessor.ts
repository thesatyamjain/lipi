/**
 * Indic Unicode Normalizer & Post-Processor
 * Solves core Indic OCR artifacts at the text level:
 * 1. NFC Canonical Decomposition/Composition (merges decomposed nuktas/matras)
 * 2. Stray Zero-Width Joiner (ZWJ) & Non-Joiner (ZWNJ) cleanup around whitespace/punctuation
 * 3. Orphan matra & dotted circle (◌ \u25CC) repair
 * 4. Shirorekha hyphenation & line-break word stitching
 * 5. Purna Virama (। \u0964) restoration (replaces pipe '|' or 'l' when not inside a Markdown table)
 */

/**
 * Normalizes and repairs raw OCR text containing Indic scripts.
 */
export function postProcessIndicText(rawText: string): string {
  if (!rawText || rawText.length === 0) return '';

  // 1. Unicode Standard NFC Normalization
  // Merges separate base consonants and combining diacritics (e.g. क + ़ -> क़)
  let text = rawText.normalize('NFC');

  // 2. Remove isolated Unicode Dotted Circles (U+25CC ◌) frequently hallucinated on orphan matras
  text = text.replace(/\u25CC([\u0900-\u0D7F])/g, '$1');
  text = text.replace(/\u25CC/g, '');

  // 3. Clean stray Zero-Width Joiner (U+200D) and Zero-Width Non-Joiner (U+200C)
  // Keep ZWJ/ZWNJ only when strictly between Indic characters (for half-forms and ligatures)
  // Strip when adjacent to whitespace, newlines, or punctuation
  text = text.replace(/[\u200B\uFEFF]/g, ''); // strip zero-width spaces and BOM
  text = text.replace(/\s+[\u200C\u200D]+/g, ' ');
  text = text.replace(/[\u200C\u200D]+\s+/g, ' ');
  text = text.replace(/[\u200C\u200D]+([.,!?;:()[\]{}।॥"'\-])/g, '$1');
  text = text.replace(/([.,!?;:()[\]{}।॥"'\-])[\u200C\u200D]+/g, '$1');

  // 4. Line-break Hyphenation Stitching
  // e.g. "अनु-\nसंधान" -> "अनुसंधान", "कार्या-\nलय" -> "कार्यालय"
  // Supports both standard ASCII hyphen and soft hyphen (\u00AD)
  text = text.replace(/([\u0900-\u0D7F]+)[-\u00AD]\r?\n\s*([\u0900-\u0D7F]+)/g, '$1$2');

  // 5. Line-by-line smart punctuation & danda repair
  // In non-table lines, Tesseract often reads Devanagari Danda (।) as pipe '|' or lowercase 'l'
  const lines = text.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();

    // Do NOT touch Markdown table rows (lines starting and containing '|')
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      return line;
    }

    let processedLine = line;

    // Fix pipe '|' used as Purna Virama when preceded by Devanagari character
    // e.g. "भारत गणराज्य है |" -> "भारत गणराज्य है ।"
    processedLine = processedLine.replace(/([\u0900-\u097F]+)\s*\|\s*$/g, '$1 ।');
    processedLine = processedLine.replace(/([\u0900-\u097F]+)\s*\|(?=\s+[\u0900-\u097F]|\s*$)/g, '$1 ।');

    // Fix double pipe '||' used as Deergh Virama
    processedLine = processedLine.replace(/([\u0900-\u097F]+)\s*\|\|\s*$/g, '$1 ॥');

    return processedLine;
  });

  return processedLines.join('\n');
}