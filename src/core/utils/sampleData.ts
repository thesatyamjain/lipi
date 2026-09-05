/**
 * Generates high-fidelity sample test pages (English, Hindi Devanagari, and Mixed)
 * using HTML5 Canvas for instant offline demo and verification.
 */

export interface SamplePageDescriptor {
  pageNumber: number;
  title: string;
  subtitle?: string;
  style?: 'gazette' | 'legal' | 'manuscript';
  lines: string[];
  table?: {
    headers: string[];
    rows: string[][];
    colWidths?: number[];
  };
}

export const SAMPLE_PAGES: SamplePageDescriptor[] = [
  {
    pageNumber: 1,
    title: 'भारत का राजपत्र / THE GAZETTE OF INDIA',
    subtitle: 'असाधारण — भाग II — खंड 1 (संविधि एवं वित्तीय आवंटन अधिसूचना)',
    style: 'gazette',
    lines: [
      'अधिसूचना संख्या: 2026/केन्द्र-912/रा.प.       नई दिल्ली, शुक्रवार, 4 सितम्बर 2026',
      'विषय: भारतीय भाषा डिजिटलीकरण एवं 1:1 पृष्ठ-संरक्षण राष्ट्रीय परियोजना',
      '',
      '1. प्रशासनिक एवं विधिक स्वीकृति (Administrative Sanction)',
      'भारत गणराज्य की समस्त 22 आधिकारिक भाषाओं में उपलब्ध विधिक, प्रशासनिक एवं ऐतिहासिक',
      'दस्तावेज़ों के सटीक डिजिटलीकरण हेतु विशेष कार्यबल का गठन किया गया है। समस्त प्रसंस्करण',
      'उच्च परिशुद्धता के साथ संपन्न होगा एवं माइक्रोसॉफ्ट वर्ड (.docx) पर 1:1 पृष्ठ संतुलन सुनिश्चित रहेगा।',
      '',
      '2. वित्तीय आवंटन एवं प्रगति सारणी (Financial Sanctions & Progress Table):',
    ],
    table: {
      headers: ['क्र. सं.', 'परियोजना मद (Program Description)', 'स्वीकृत राशि', 'प्रगति स्थिति'],
      colWidths: [100, 520, 220, 200],
      rows: [
        ['1', 'देवनागरी व प्रांतीय भाषा ओसीआर एवं लेआउट मॉडल', '₹ 25,00,000', 'स्वीकृत'],
        ['2', 'प्राचीन पांडुलिपि एवं हस्तलिखित प्रलेख डिजिटलीकरण', '₹ 32,50,000', 'प्रगति पर'],
        ['3', 'उच्च न्यायालयीन अभिलेखागार हाई-स्पीड स्कैनिंग', '₹ 18,20,000', 'सत्यापित'],
      ],
    },
  },
  {
    pageNumber: 2,
    title: 'उच्च न्यायालय / HIGH COURT OF JUDICATURE',
    subtitle: 'न्यायिक वाद संख्या: 412/2024 (सिविल अपील) — अंतिम आदेश',
    style: 'legal',
    lines: [
      'अदालत: पीठ संख्या 3, माननीय मुख्य न्यायाधिपति न्यायालय',
      'पक्षकार: श्री रमेश चन्द्र एवं अन्य (याचिकाकर्ता) बनाम राज्य एवं अन्य (प्रतिवादी)',
      '',
      '१. पत्रावली का अवलोकन एवं आदेश (Judicial Order)',
      'प्रस्तुत पत्रावली एवं अधीनस्थ न्यायालय के अभिलेखों का सम्यक परिशीलन किया गया ।',
      'उभय पक्षों के विद्वान अधिवक्ताओं के तर्कों तथा साक्ष्य अधिनियम के प्रावधानों के',
      'आलोक में यह स्पष्ट परिलक्षित होता है कि संविदा की सभी शर्तें विधिक रूप से मान्य थीं ।',
      '',
      '२. विधिक निष्कर्ष एवं अंतिम निर्णय',
      'सिविल प्रक्रिया संहिता की धारा 14-बी के तहत प्रस्तुत याचिका का निस्तारण किया जाता है ।',
      'अधीनस्थ न्यायालय के निर्णय की पुष्टि की जाती है तथा अपीलीय राहत अस्वीकृत की जाती है ।',
      '',
      '३. अनुपालन एवं क्रियान्वयन निर्देश',
      'संबंधित प्रशासनिक अधिकारी आदेश की प्रमाणित प्रति प्राप्त होने के 30 दिवस में क्रियान्वयन करें ।',
      '',
      'हस्ताक्षर एवं न्यायालयीन मुहर: मुख्य निबंधक (Registrar General), उच्च न्यायालय',
    ],
  },
  {
    pageNumber: 3,
    title: 'राष्ट्रीय पांडुलिपि अभिलेखागार — हस्तलिखित टीप',
    subtitle: 'National Manuscript Mission — Manuscript & Cursive Specimen',
    style: 'manuscript',
    lines: [
      '॥ शुभम् भवतु — श्री गणेशाय नमः ॥',
      'पांडुलिपि संदर्भ संख्या: 108/क (दुर्लभ ऐतिहासिक पत्रक संग्रह)',
      '',
      'हस्तलिखित टिप्पणी (Handwritten Notes & Annotations):',
      'संवत् २०८१ भाद्रपद मास। यह ऐतिहासिक पत्रक प्राचीन लिपि के संवर्धन एवं संरक्षण हेतु',
      'प्रस्तुत किया गया। मूल पत्रक के प्रत्येक पृष्ठ में अक्षरों का विन्यास, मात्राओं की स्थिति',
      'तथा शिरोरेखा की निरंतरता का अवलोकन किया गया।',
      '',
      'अभिलेखपाल की व्यक्तिगत सत्यापन टीप:',
      'मूल प्रतिलिपि से मिलान पूर्ण हो चुका है। सभी पृष्ठ एवं हाशिए की प्रविष्टियां पूर्णतः',
      'सुरक्षित एवं पठनीय पाई गईं। इस पर विधिक सत्यापन मोहर अंकित की जाती है।',
      '',
      'हस्तलिखित हस्ताक्षर: मुख्य अभिलेखपाल (Chief Archivist), 4 September 2026',
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

  const isManuscript = desc.style === 'manuscript';
  const isLegal = desc.style === 'legal';

  // Realistic paper background: warm aged tone for manuscript, clean archival tone for gazette/legal
  ctx.fillStyle = isManuscript ? '#faf6eb' : isLegal ? '#f8fafc' : '#fafaf8';
  ctx.fillRect(0, 0, width, height);

  // Outer border / header rule
  ctx.strokeStyle = isManuscript ? '#8c7b64' : '#2d3748';
  ctx.lineWidth = isManuscript ? 2 : 3;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Decorative inner line for legal/manuscript
  if (isManuscript || isLegal) {
    ctx.strokeStyle = isManuscript ? '#d6c8b4' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(68, 68, width - 136, height - 136);
  }

  // Header Title
  ctx.fillStyle = isManuscript ? '#2a2118' : '#1a202c';
  ctx.font = 'bold 30px "Geist", "Nirmala UI", "Mangal", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(desc.title, width / 2, 130);

  // Header Subtitle
  if (desc.subtitle) {
    ctx.font = '18px "Geist", "Nirmala UI", "Mangal", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = isManuscript ? '#6b5847' : '#4a5568';
    ctx.fillText(desc.subtitle, width / 2, 160);
  }

  // Divider line
  ctx.beginPath();
  ctx.moveTo(100, 185);
  ctx.lineTo(width - 100, 185);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = isManuscript ? '#b8a68e' : '#a0aec0';
  ctx.stroke();

  // Content lines
  ctx.textAlign = 'left';
  let y = 245;

  for (const line of desc.lines) {
    if (line === '') {
      y += 22;
      continue;
    }

    const isHeader =
      line.startsWith('1.') ||
      line.startsWith('2.') ||
      line.startsWith('3.') ||
      line.startsWith('१.') ||
      line.startsWith('२.') ||
      line.startsWith('३.') ||
      line.startsWith('॥') ||
      line.startsWith('हस्तलिखित टिप्पणी') ||
      line.startsWith('अभिलेखपाल');

    if (isHeader) {
      ctx.font = isManuscript
        ? 'bold 23px "Nirmala UI", "Mangal", "Segoe UI", Arial, sans-serif'
        : 'bold 22px "Geist", "Nirmala UI", "Mangal", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = isManuscript ? '#7b341e' : isLegal ? '#1e3a8a' : '#2b6cb0';
    } else {
      ctx.font = isManuscript
        ? '21px "Nirmala UI", "Mangal", "Segoe UI", Arial, sans-serif'
        : '21px "Geist", "Nirmala UI", "Mangal", "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = isManuscript ? '#1f242e' : '#2d3748';
    }

    ctx.fillText(line, 100, y);
    y += 38;
  }

  // Render Structured Table if present
  if (desc.table) {
    y += 10;
    const tableX = 100;
    const colWidths = desc.table.colWidths || [100, 520, 220, 200];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const rowHeight = 44;

    // Header Background
    ctx.fillStyle = '#edf2f7';
    ctx.fillRect(tableX, y, totalWidth, rowHeight);

    // Outer table border
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tableX, y, totalWidth, rowHeight * (desc.table.rows.length + 1));

    // Header text
    ctx.fillStyle = '#1a202c';
    ctx.font = 'bold 18px "Geist", "Nirmala UI", "Mangal", Arial, sans-serif';
    let curX = tableX;
    for (let c = 0; c < desc.table.headers.length; c++) {
      ctx.fillText(desc.table.headers[c], curX + 12, y + 28);
      curX += colWidths[c];
      // Vertical divider
      if (c < desc.table.headers.length - 1) {
        ctx.beginPath();
        ctx.moveTo(curX, y);
        ctx.lineTo(curX, y + rowHeight * (desc.table.rows.length + 1));
        ctx.strokeStyle = '#cbd5e0';
        ctx.stroke();
      }
    }

    // Rows
    for (let r = 0; r < desc.table.rows.length; r++) {
      const rowY = y + rowHeight * (r + 1);

      // Horizontal divider
      ctx.beginPath();
      ctx.moveTo(tableX, rowY);
      ctx.lineTo(tableX + totalWidth, rowY);
      ctx.strokeStyle = '#cbd5e0';
      ctx.stroke();

      ctx.font = '18px "Geist", "Nirmala UI", "Mangal", Arial, sans-serif';
      ctx.fillStyle = '#2d3748';

      let cellX = tableX;
      for (let c = 0; c < desc.table.rows[r].length; c++) {
        ctx.fillText(desc.table.rows[r][c], cellX + 12, rowY + 28);
        cellX += colWidths[c];
      }
    }

    y += rowHeight * (desc.table.rows.length + 1) + 40;

    // Signatory beneath table
    ctx.font = 'bold 18px "Nirmala UI", "Mangal", Arial, sans-serif';
    ctx.fillStyle = '#2d3748';
    ctx.fillText('हस्ताक्षर: संयुक्त सचिव एवं मिशन निदेशक, भारत सरकार', 100, y);
  }

  // Footer stamp
  ctx.font = '14px "Geist", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#718096';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Lipi Engine — Verified Precision Test Specimen (Page ${desc.pageNumber} of ${SAMPLE_PAGES.length})`,
    width / 2,
    height - 90
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || new Blob()), 'image/jpeg', 0.94);
  });
}
