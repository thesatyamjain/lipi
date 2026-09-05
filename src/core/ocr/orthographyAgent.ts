/**
 * Multi-Agent Pipeline: Stage 5, 6, & 7
 * - Stage 5: Indic Orthography Cross-Validation Agent
 * - Stage 6: Contextual Correction Agent (Non-Destructive Diffs)
 * - Stage 7: QA & Calibrated Confidence Agent
 */

import type { TextDiff } from '../../types/index.ts';

// Indic dependent matras (Devanagari, Bengali, Gurmukhi, Gujarati, Odia, Tamil, Telugu, Kannada, Malayalam)
const DEPENDENT_MATRA_REGEX = /^[ािीुूृॄॢॣेैोौॉॅा\u093e-\u094c\u0962\u0963\u09be-\u09cc\u0a3e-\u0a4c\u0abe-\u0acc\u0b3e-\u0bcc\u0bbe-\u0bcc\u0c3e-\u0ccc\u0cbe-\u0ccc\u0d3e-\u0dcc]/;

// Valid Devanagari consonants that can take a Nukta (़ U+093C):
// क़ (क), ख़ (ख), ग़ (ग), ज़ (ज), ड़ (ड), ढ़ (ढ), फ़ (फ)
const VALID_NUKTA_BASES = new Set(['क', 'ख', 'ग', 'ज', 'ड', 'ढ', 'फ', 'य', 'र']);

export interface OrthographyCheckResult {
  isValid: boolean;
  flags: string[];
  validityScore: number; // 0.0 - 1.0
  orphanedMatraCount: number;
  doubleViramaCount: number;
  invalidNuktaCount: number;
}

/**
 * Stage 5: Scans text tokens against Indic script orthographic syntax
 */
export function validateIndicOrthography(text: string): OrthographyCheckResult {
  if (!text || text.trim().length === 0) {
    return {
      isValid: true,
      flags: [],
      validityScore: 1.0,
      orphanedMatraCount: 0,
      doubleViramaCount: 0,
      invalidNuktaCount: 0,
    };
  }

  const flags: string[] = [];
  let orphanedMatraCount = 0;
  let doubleViramaCount = 0;
  let invalidNuktaCount = 0;

  // 1. Orphaned Matra Detection: dependent vowel after whitespace or at token start without base
  const tokens = text.split(/\s+/);
  for (const token of tokens) {
    if (token.length > 0 && DEPENDENT_MATRA_REGEX.test(token)) {
      orphanedMatraCount++;
    }
  }

  if (orphanedMatraCount > 0) {
    flags.push(`Orphaned Matra detected (${orphanedMatraCount} occurrence${orphanedMatraCount > 1 ? 's' : ''})`);
  }

  // 2. Double Virama / Halant Anomaly: consecutive halants (््)
  const doubleViramaMatches = text.match(/[\u094d\u09cd\u0a4d\u0acd\u0b4d\u0bcd\u0c4d\u0ccd\u0d4d]{2,}/g);
  if (doubleViramaMatches) {
    doubleViramaCount = doubleViramaMatches.length;
    flags.push(`Invalid consecutive virama/halant sequence (${doubleViramaCount})`);
  }

  // 3. Nukta Placement Checks: verify Nukta (़ U+093C) only attaches to legitimate base consonants
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\u093C') {
      const prevChar = i > 0 ? text[i - 1] : '';
      if (!VALID_NUKTA_BASES.has(prevChar)) {
        invalidNuktaCount++;
      }
    }
  }

  if (invalidNuktaCount > 0) {
    flags.push(`Anomalous Nukta placement on non-consonant (${invalidNuktaCount})`);
  }

  // Penalty based on total anomalies relative to text length
  const totalAnomalies = orphanedMatraCount + doubleViramaCount + invalidNuktaCount;
  const tokenCount = Math.max(1, tokens.length);
  const penalty = Math.min(1.0, (totalAnomalies * 2) / tokenCount);
  const validityScore = Math.max(0.1, Number((1.0 - penalty).toFixed(2)));

  return {
    isValid: flags.length === 0,
    flags,
    validityScore,
    orphanedMatraCount,
    doubleViramaCount,
    invalidNuktaCount,
  };
}

/**
 * Stage 6: Contextual Correction Matrix
 * Detects known optical confusion patterns and produces non-destructive structured diffs.
 * NEVER overwrites raw_text.
 */
export function generateContextualDiffs(text: string, _script: string = 'Devanagari'): TextDiff[] {
  if (!text || text.trim().length === 0) return [];

  const diffs: TextDiff[] = [];
  let diffCounter = 1;

  // Pattern 1: Ligature confusion: 'रव' misrecognized as 'ख'
  // Common in printed legal Hindi (e.g. 'रवबर' -> 'खबर', 'ताररव' -> 'तारीख')
  const ravRegex = /(^|\s|[\u0900-\u097F])रव(बर|त|ना|श|जाना|ार|ीख)/g;
  let match: RegExpExecArray | null;
  while ((match = ravRegex.exec(text)) !== null) {
    const suffix = match[2];
    const originalWord = 'रव' + suffix;
    const suggestedWord = 'ख' + suffix;

    diffs.push({
      diffId: `diff_${diffCounter++}`,
      original: originalWord,
      suggested: suggestedWord,
      reason: "Ligature confusion: isolated 'रव' adjacent to bilabial consonant represents 'ख'",
      status: 'proposed',
      confidenceGain: 0.15,
      timestamp: new Date().toISOString(),
    });
  }

  // Pattern 2: Numeral confusion: Latin '0' confused with Devanagari zero '०' or Latin '8' with '४'
  // When inside a contiguous sequence of Devanagari digits
  const numeralDevanagari = /([\u0966-\u096F]+)[0O]([\u0966-\u096F]+)/g;
  while ((match = numeralDevanagari.exec(text)) !== null) {
    const orig = match[0];
    const suggested = match[1] + '०' + match[2];
    diffs.push({
      diffId: `diff_${diffCounter++}`,
      original: orig,
      suggested,
      reason: "Numeral confusion: Latin '0/O' in Devanagari digit sequence represents '०'",
      status: 'proposed',
      confidenceGain: 0.12,
      timestamp: new Date().toISOString(),
    });
  }

  // Pattern 3: Glyph confusion: Latin 'I' in legal section/numeric sequences (e.g. "4I2/2024" -> "412/2024")
  const latinINum = /(^|\s|[^\w])(\d+)I(\d+(?:\/\d+)?)(?=$|\s|[^\w])/g;
  while ((match = latinINum.exec(text)) !== null) {
    const num1 = match[2];
    const num2 = match[3];
    diffs.push({
      diffId: `diff_${diffCounter++}`,
      original: `${num1}I${num2}`,
      suggested: `${num1}1${num2}`,
      reason: "Numeral confusion: Latin 'I' in numeric code represents digit '1'",
      status: 'proposed',
      confidenceGain: 0.1,
      timestamp: new Date().toISOString(),
    });
  }

  // Pattern 4: Severed Shirorekha: Isolated single Devanagari character followed by space and word
  const severedShirorekha = /(^|\s)([क-ह])\s+([क-ह][\u0900-\u097F]{2,})/g;
  while ((match = severedShirorekha.exec(text)) !== null) {
    const char = match[2];
    const rest = match[3];
    if (['प्र', 'अ', 'वि', 'अनु', 'सु'].includes(char)) {
      diffs.push({
        diffId: `diff_${diffCounter++}`,
        original: `${char} ${rest}`,
        suggested: `${char}${rest}`,
        reason: 'Severed Shirorekha: broken headline falsely split prefix from base word',
        status: 'proposed',
        confidenceGain: 0.08,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return diffs;
}

/**
 * Stage 7: QA & Calibrated Confidence Agent
 * Formula: Confidence_calibrated = 0.5 * (OCR Engine Conf) + 0.3 * (Dictionary Plausibility) + 0.2 * (Orthographic Validity)
 */
export function calculateCalibratedConfidence(
  engineConfidence: number, // 0 - 100
  text: string,
  _script: string = 'Devanagari'
): {
  calibratedConfidence: number; // 0 - 100
  werHeuristic: number; // estimated WER 0.0 - 1.0
  needsReview: boolean;
  reviewFlags: string[];
} {
  const normEngine = Math.max(0, Math.min(100, engineConfidence)) / 100;
  const ortho = validateIndicOrthography(text);

  // Dictionary Plausibility heuristic:
  // Ratio of valid alphabetic tokens without random punctuation/digit mix
  const tokens = text.trim().split(/\s+/).filter((t) => t.length > 0);
  let plausibleCount = 0;
  for (const token of tokens) {
    if (/^[\u0900-\u0D7Fa-zA-Z0-9।॥.,'":;()\-\/₹]+$/.test(token) && token.length <= 25) {
      plausibleCount++;
    }
  }
  const dictPlausibility = tokens.length > 0 ? plausibleCount / tokens.length : 1.0;

  // Multi-factor weighted calibration
  const calibratedScore =
    0.5 * normEngine +
    0.3 * dictPlausibility +
    0.2 * ortho.validityScore;

  const calibratedPercent = Math.round(calibratedScore * 100);

  // Word Error Rate (WER) heuristic estimation
  const werHeuristic = Number(Math.max(0, Math.min(1.0, 1.0 - calibratedScore)).toFixed(3));

  // Needs review if calibrated score < 75% or orthography flagged critical issues
  const needsReview = calibratedPercent < 75 || !ortho.isValid;
  const reviewFlags = [...ortho.flags];

  if (calibratedPercent < 75) {
    reviewFlags.push(`Low Calibrated Confidence (${calibratedPercent}%)`);
  }

  return {
    calibratedConfidence: calibratedPercent,
    werHeuristic,
    needsReview,
    reviewFlags,
  };
}
