/**
 * Generates high-fidelity sample test pages (English, Hindi Devanagari, and Mixed)
 * using HTML5 Canvas for instant offline demo and verification.
 */

export interface SamplePageDescriptor {
  pageNumber: number;
  title: string;
  lines: string[];
}

export const SAMPLE_PAGES: SamplePageDescriptor[] = [
  {
    pageNumber: 1,
    title: 'LIPI BHARATIYA EXECUTIVE MEMORANDUM',
    lines: [
      'Document Reference: LIPI-2026-OCR-09',
      'Subject: Browser-Native Bharatiya Document Intelligence & Fidelity Architecture',
      '',
      '1. EXECUTIVE SUMMARY',
      'Traditional optical character recognition architectures exhibit severe regression in multi-lingual',
      'and regional script fidelity. Furthermore, document page boundaries are routinely mutilated during',
      'export pipelines, causing irreversible page-count inflation in formal legal and regulatory workflows.',
      '',
      '2. SPECIFICATION GUARANTEES',
      '- Strict 1:1 Page-to-Page Output Fidelity on Microsoft Word (.docx) export.',
      '- Dynamic thread orchestration utilizing Web Workers and client-side hardware concurrency.',
      '- Multimodal Vision Cocktail Model integrating base WASM detection with context refinement.',
      '',
      'Authorized by: Senior Operations Board, Lipi Document Intelligence.',
    ],
  },
  {
    pageNumber: 2,
    title: 'भारत गणराज्य — आधिकारिक अभिलेख (GOVERNMENT RECORD)',
    lines: [
      'दस्तावेज़ संख्या: 2026/हिन्द-941',
      'विषय: डिजिटल दस्तावेज़ सत्यापन एवं भाषा संरक्षण रिपोर्ट',
      '',
      '१. प्रस्तावना एवं पृष्ठभूमि',
      'यह अभिलेख पूर्णतः ब्राउज़र के भीतर सुरक्षित रूप से संसाधित किया गया है।',
      'किसी भी बाहरी सर्वर पर कोई डेटा अपलोड नहीं किया जाता है। आपकी गोपनीयता सर्वोच्च प्राथमिकता है।',
      '',
      '२. तकनीकी क्षमताएं और प्रदर्शन मानक',
      'देवनागरी लिपि में मात्राओं, संयुक्त अक्षरों (जैसे: क्ष, त्र, ज्ञ, श्र) और नुक्ता चिह्नों का',
      'सटीक निष्कर्षण सुनिश्चित करने के लिए हाई-रिज़ॉल्यूशन विज़न मॉडल का प्रयोग किया गया है।',
      '',
      'हस्ताक्षर: सक्षम प्राधिकारी (Authorized Officer), नई दिल्ली',
    ],
  },
  {
    pageNumber: 3,
    title: 'SCHEDULE OF LEGAL TERMS / कानूनी नियम एवं शर्तें',
    lines: [
      'Bilingual Clause Identification — Section 14-B',
      '',
      'Item 01: Client Data Sovereignty / ग्राहक डेटा संप्रभुता',
      'All computational processing executes strictly within the client sandbox.',
      'समस्त प्रसंस्करण उपयोगकर्ता के अपने कंप्यूटर पर स्थानीय रूप से संपन्न होगा।',
      '',
      'Item 02: Verification Standards / सत्यापन मानक',
      'Minimum recognition confidence threshold set to 85.0% for automated clearing.',
      'न्यूनतम स्वीकृति स्तर पचासी प्रतिशत (85%) निर्धारित किया गया है।',
      '',
      'Verified & Sealed: Lipi Compliance Engineering, September 2026',
    ],
  },
];

/**
 * Creates an image Blob from a sample page descriptor using clean Canvas typography.
 */
export async function createSamplePageBlob(desc: SamplePageDescriptor): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const width = 1240; // A4 ratio at 150 DPI
  const height = 1754;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Realistic paper background with subtle scan tone
  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, width, height);

  // Outer border / header rule
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Header Title
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 32px "Geist", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(desc.title, width / 2, 140);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(100, 170);
  ctx.lineTo(width - 100, 170);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#a0aec0';
  ctx.stroke();

  // Content lines
  ctx.textAlign = 'left';
  let y = 240;

  for (const line of desc.lines) {
    if (line === '') {
      y += 24;
      continue;
    }

    const isHeader = line.startsWith('1.') || line.startsWith('2.') || line.startsWith('१.') || line.startsWith('२.') || line.startsWith('Item');
    if (isHeader) {
      ctx.font = 'bold 24px "Geist", "Nirmala UI", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#2b6cb0';
    } else {
      ctx.font = '22px "Geist", "Nirmala UI", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#2d3748';
    }

    ctx.fillText(line, 100, y);
    y += 40;
  }

  // Footer stamp
  ctx.font = 'italic 16px "Geist", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#718096';
  ctx.textAlign = 'center';
  ctx.fillText(`KALON Co. Precision Test Document — Page ${desc.pageNumber} of ${SAMPLE_PAGES.length}`, width / 2, height - 100);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || new Blob()), 'image/jpeg', 0.92);
  });
}
