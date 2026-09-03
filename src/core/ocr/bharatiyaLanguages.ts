/**
 * Comprehensive Bharatiya (Indian) Languages & Script Registry
 * Covers all 22 Scheduled Languages of India under the 8th Schedule of the Constitution
 * with native names, Unicode script ranges, Tesseract model mappings, and bilingual pairs.
 */

export interface BharatiyaLanguage {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  tesseractCode: string;
  bilingualCode: string;
  hasDedicatedTesseractModel: boolean;
  scriptRangeRegex: RegExp;
}

export const SCRIPT_RANGES_MAP: Record<string, { regex: RegExp; defaultLang: string }> = {
  Devanagari: {
    // Hindi, Marathi, Sanskrit, Nepali, Bodo, Dogri, Konkani, Maithili
    regex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
    defaultLang: 'hin',
  },
  Bengali: {
    // Bengali, Assamese, Manipuri (Meetei in Bengali script)
    regex: /[\u0980-\u09FF]/g,
    defaultLang: 'ben',
  },
  Tamil: {
    // Tamil
    regex: /[\u0B80-\u0BFF]/g,
    defaultLang: 'tam',
  },
  Telugu: {
    // Telugu
    regex: /[\u0C00-\u0C7F]/g,
    defaultLang: 'tel',
  },
  Gujarati: {
    // Gujarati
    regex: /[\u0A80-\u0AFF]/g,
    defaultLang: 'guj',
  },
  Kannada: {
    // Kannada
    regex: /[\u0C80-\u0CFF]/g,
    defaultLang: 'kan',
  },
  Malayalam: {
    // Malayalam
    regex: /[\u0D00-\u0D7F]/g,
    defaultLang: 'mal',
  },
  Gurmukhi: {
    // Punjabi
    regex: /[\u0A00-\u0A7F]/g,
    defaultLang: 'pan',
  },
  Odia: {
    // Odia
    regex: /[\u0B00-\u0B7F]/g,
    defaultLang: 'ori',
  },
  PersoArabic: {
    // Urdu, Kashmiri, Sindhi
    regex: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
    defaultLang: 'urd',
  },
  OlChiki: {
    // Santali
    regex: /[\u1C50-\u1C7F]/g,
    defaultLang: 'hin',
  },
  MeeteiMayek: {
    // Manipuri (Meetei Mayek script)
    regex: /[\uABC0-\uABFF\uAAE0-\uAAFF]/g,
    defaultLang: 'ben',
  },
  Latin: {
    // English
    regex: /[A-Za-z]/g,
    defaultLang: 'eng',
  },
};

export const BHARATIYA_LANGUAGES: BharatiyaLanguage[] = [
  {
    code: 'hin',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    tesseractCode: 'hin',
    bilingualCode: 'eng+hin',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'ben',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    tesseractCode: 'ben',
    bilingualCode: 'eng+ben',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0980-\u09FF]/g,
  },
  {
    code: 'tam',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    tesseractCode: 'tam',
    bilingualCode: 'eng+tam',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0B80-\u0BFF]/g,
  },
  {
    code: 'tel',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    tesseractCode: 'tel',
    bilingualCode: 'eng+tel',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0C00-\u0C7F]/g,
  },
  {
    code: 'mar',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    tesseractCode: 'mar',
    bilingualCode: 'eng+mar',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'guj',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    tesseractCode: 'guj',
    bilingualCode: 'eng+guj',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0A80-\u0AFF]/g,
  },
  {
    code: 'urd',
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'Perso-Arabic',
    tesseractCode: 'urd',
    bilingualCode: 'eng+urd',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  },
  {
    code: 'kan',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    tesseractCode: 'kan',
    bilingualCode: 'eng+kan',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0C80-\u0CFF]/g,
  },
  {
    code: 'mal',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    tesseractCode: 'mal',
    bilingualCode: 'eng+mal',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0D00-\u0D7F]/g,
  },
  {
    code: 'ori',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    tesseractCode: 'ori',
    bilingualCode: 'eng+ori',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0B00-\u0B7F]/g,
  },
  {
    code: 'pan',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    tesseractCode: 'pan',
    bilingualCode: 'eng+pan',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0A00-\u0A7F]/g,
  },
  {
    code: 'asm',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali',
    tesseractCode: 'asm',
    bilingualCode: 'eng+asm',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0980-\u09FF]/g,
  },
  {
    code: 'san',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    script: 'Devanagari',
    tesseractCode: 'san',
    bilingualCode: 'eng+san',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'nep',
    name: 'Nepali',
    nativeName: 'नेपाली',
    script: 'Devanagari',
    tesseractCode: 'nep',
    bilingualCode: 'eng+nep',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'bod',
    name: 'Bodo',
    nativeName: 'बड़ो',
    script: 'Devanagari',
    tesseractCode: 'bod',
    bilingualCode: 'eng+bod',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'snd',
    name: 'Sindhi',
    nativeName: 'सिन्धी / سنڌي',
    script: 'Perso-Arabic / Devanagari',
    tesseractCode: 'snd',
    bilingualCode: 'eng+snd',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[\u0600-\u06FF\u0750-\u077F\u0900-\u097F]/g,
  },
  {
    code: 'dgo',
    name: 'Dogri',
    nativeName: 'डोगरी',
    script: 'Devanagari',
    tesseractCode: 'hin', // Devanagari OCR model
    bilingualCode: 'eng+hin',
    hasDedicatedTesseractModel: false,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'kas',
    name: 'Kashmiri',
    nativeName: 'कॉशुर / کٲشُر',
    script: 'Perso-Arabic / Devanagari',
    tesseractCode: 'urd', // Perso-Arabic model
    bilingualCode: 'eng+urd',
    hasDedicatedTesseractModel: false,
    scriptRangeRegex: /[\u0600-\u06FF\u0750-\u077F\u0900-\u097F]/g,
  },
  {
    code: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    script: 'Devanagari',
    tesseractCode: 'mar', // Devanagari model
    bilingualCode: 'eng+mar',
    hasDedicatedTesseractModel: false,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    script: 'Devanagari',
    tesseractCode: 'hin', // Devanagari model
    bilingualCode: 'eng+hin',
    hasDedicatedTesseractModel: false,
    scriptRangeRegex: /[\u0900-\u097F\uA8E0-\uA8FF]/g,
  },
  {
    code: 'mni',
    name: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোন্ / ꯃꯩꯇꯩꯂꯣꯟ',
    script: 'Bengali / Meetei Mayek',
    tesseractCode: 'ben', // Bengali script model
    bilingualCode: 'eng+ben',
    hasDedicatedTesseractModel: false,
    scriptRangeRegex: /[\u0980-\u09FF\uABC0-\uABFF]/g,
  },
  {
    code: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    script: 'Ol Chiki / Devanagari',
    tesseractCode: 'hin', // Devanagari fallback or AI vision
    bilingualCode: 'eng+hin',
    hasDedicatedTesseractModel: false,
    scriptRangeRegex: /[\u1C50-\u1C7F\u0900-\u097F]/g,
  },
  {
    code: 'eng',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    tesseractCode: 'eng',
    bilingualCode: 'eng',
    hasDedicatedTesseractModel: true,
    scriptRangeRegex: /[A-Za-z]/g,
  },
];

/**
 * Verified Tesseract traineddata language codes available on CDN
 */
export const VALID_TESSERACT_LANG_CODES = new Set([
  'asm', 'ben', 'bod', 'guj', 'hin', 'kan', 'mal', 'mar',
  'nep', 'ori', 'pan', 'san', 'snd', 'tam', 'tel', 'urd', 'eng',
]);

/**
 * Resolves any language code or composite string to guaranteed valid Tesseract.js model codes.
 * Prevents 404 errors on missing traineddata files.
 */
export function resolveTesseractLang(lang: string | undefined): string {
  if (!lang || lang === 'auto') {
    return 'eng+hin';
  }

  // Handle composite language string (e.g. 'eng+tam' or 'eng+dgo')
  const parts = lang.split('+').map((p) => p.trim()).filter(Boolean);
  const resolvedParts: string[] = [];

  for (const part of parts) {
    if (VALID_TESSERACT_LANG_CODES.has(part)) {
      resolvedParts.push(part);
    } else {
      // Find matching language definition fallback
      const found = BHARATIYA_LANGUAGES.find((l) => l.code === part);
      if (found && VALID_TESSERACT_LANG_CODES.has(found.tesseractCode)) {
        resolvedParts.push(found.tesseractCode);
      }
    }
  }

  // Deduplicate and fallback if empty
  const unique = Array.from(new Set(resolvedParts));
  return unique.length > 0 ? unique.join('+') : 'eng+hin';
}

/**
 * Returns a human-friendly display label for any language code or pair
 */
export function getLanguageDisplayLabel(lang: string): string {
  if (lang === 'auto') return 'Auto-Detect (22 Bharatiya Languages)';

  const parts = lang.split('+');
  const labels = parts.map((p) => {
    const found = BHARATIYA_LANGUAGES.find((l) => l.code === p || l.tesseractCode === p);
    if (found) {
      return found.code === 'eng' ? 'English' : `${found.nativeName} (${found.name})`;
    }
    return p;
  });

  return labels.join(' + ');
}
