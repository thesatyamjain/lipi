/**
 * Script & Language Detection Utilities for Pan-Bharatiya & Global Documents
 * Analyzes Unicode script ranges and character frequency to identify
 * Devanagari, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam,
 * Gurmukhi, Odia, Urdu/Perso-Arabic, Latin, etc.
 */

import { SCRIPT_RANGES_MAP } from './bharatiyaLanguages.ts';

export interface DetectedScriptResult {
  primaryScript: string;
  isMixed: boolean;
  scripts: {
    name: string;
    ratio: number;
    count: number;
  }[];
  suggestedTesseractLang: string;
}

const GLOBAL_SCRIPT_RANGES: Record<string, { regex: RegExp; tesseractLang: string }> = {
  ...Object.fromEntries(
    Object.entries(SCRIPT_RANGES_MAP).map(([k, v]) => [k, { regex: v.regex, tesseractLang: v.defaultLang }])
  ),
  CJK: {
    regex: /[\u4E00-\u9FFF]/g,
    tesseractLang: 'chi_sim',
  },
  Cyrillic: {
    regex: /[\u0400-\u04FF]/g,
    tesseractLang: 'rus',
  },
};

/**
 * Analyzes raw text output to determine its predominant script and language composition.
 */
export function detectScriptFromText(text: string, defaultLang: string = 'eng+hin'): DetectedScriptResult {
  if (!text || text.trim().length === 0) {
    return {
      primaryScript: 'Unknown',
      isMixed: false,
      scripts: [],
      suggestedTesseractLang: defaultLang,
    };
  }

  const results: { name: string; count: number; ratio: number; tesseractLang: string }[] = [];
  let totalScriptChars = 0;

  for (const [name, config] of Object.entries(GLOBAL_SCRIPT_RANGES)) {
    // Reset regex index before matching
    config.regex.lastIndex = 0;
    const matches = text.match(config.regex);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      results.push({
        name,
        count,
        ratio: 0,
        tesseractLang: config.tesseractLang,
      });
      totalScriptChars += count;
    }
  }

  if (totalScriptChars === 0) {
    return {
      primaryScript: 'Latin',
      isMixed: false,
      scripts: [{ name: 'Latin', count: 0, ratio: 1 }],
      suggestedTesseractLang: defaultLang,
    };
  }

  results.forEach((item) => {
    item.ratio = item.count / totalScriptChars;
  });

  results.sort((a, b) => b.count - a.count);

  const primary = results[0];
  const hasLatin = results.some((r) => r.name === 'Latin' && r.ratio > 0.08);
  const nonLatinScripts = results.filter((r) => r.name !== 'Latin' && r.ratio > 0.12);

  let suggestedLang = primary.tesseractLang;
  let isMixed = results.length > 1 && results[1].ratio > 0.15;

  if (nonLatinScripts.length > 0) {
    const topIndic = nonLatinScripts[0];
    if (hasLatin) {
      // Bilingual Indian document pattern (e.g. 'hin+eng', 'tam+eng', 'ben+eng')
      suggestedLang = `${topIndic.tesseractLang}+eng`;
      isMixed = true;
    } else {
      suggestedLang = topIndic.tesseractLang;
    }
  } else if (primary.name === 'Latin') {
    suggestedLang = 'eng';
  }

  let primaryScriptName = primary.name;
  if (primary.name === 'Latin' && nonLatinScripts.length > 0 && nonLatinScripts[0].ratio > 0.25) {
    primaryScriptName = nonLatinScripts[0].name;
  }

  return {
    primaryScript: primaryScriptName,
    isMixed,
    scripts: results.map((r) => ({ name: r.name, ratio: r.ratio, count: r.count })),
    suggestedTesseractLang: suggestedLang,
  };
}
