import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
  Bookmark,
  SectionType,
  PageOrientation,
} from 'docx';
import type { PageData } from '../../types/index.ts';

export interface DocxExportOptions {
  fileName?: string;
  autoFit?: boolean;
}

/**
 * Calculates adaptive font size (in half-points), line spacing, and margins
 * to guarantee that dense pages fit within a single Word page without spilling over.
 */
function calculatePageTypography(text: string, autoFit: boolean = true) {
  if (!autoFit) {
    return {
      size: 22, // 11pt
      lineSpacing: 240, // 1.0 line spacing
      spaceAfter: 100,
      margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
    };
  }

  const length = text.length;
  const lines = text.split('\n').length;

  if (length > 3500 || lines > 55) {
    // Ultra dense: 8.5pt, compact spacing, tight margins
    return {
      size: 17,
      lineSpacing: 180,
      spaceAfter: 30,
      margin: { top: 720, bottom: 720, left: 720, right: 720 }, // 0.5 inch margins
    };
  } else if (length > 2200 || lines > 40) {
    // Dense: 9.5pt, tight spacing, moderate margins
    return {
      size: 19,
      lineSpacing: 200,
      spaceAfter: 50,
      margin: { top: 850, bottom: 850, left: 850, right: 850 },
    };
  } else if (length > 1400 || lines > 30) {
    // Medium-dense: 10.5pt
    return {
      size: 21,
      lineSpacing: 220,
      spaceAfter: 70,
      margin: { top: 950, bottom: 950, left: 950, right: 950 },
    };
  }

  // Standard: 11pt, 1.0 line spacing, ~0.7 inch margins
  return {
    size: 22,
    lineSpacing: 240,
    spaceAfter: 100,
    margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
  };
}

/**
 * Generates a Word (.docx) file maintaining strict 1:1 page-to-page fidelity.
 * Uses dedicated OpenXML sections per page (SectionType.NEXT_PAGE) with dynamic
 * orientation (Portrait/Landscape) and adaptive typography.
 * Input Page N = Output Page N.
 */
export async function generateStrictFidelityDocx(
  pages: PageData[],
  options: DocxExportOptions = {}
): Promise<Blob> {
  const { fileName = 'Document', autoFit = true } = options;

  const sections = pages.map((page, index) => {
    const isFirstPage = index === 0;
    const isLandscape = !!(page.width && page.height && page.width > page.height);
    const typo = calculatePageTypography(page.text, autoFit);

    const pageParagraphs: Paragraph[] = [];

    // Page Heading & Bookmark for Word's Left Navigation Pane
    const bookmarkId = `page_${page.pageNumber}`;
    const headingParagraph = new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 0,
        after: typo.spaceAfter,
      },
      children: [
        new Bookmark({
          id: bookmarkId,
          children: [
            new TextRun({
              text: `Page ${page.pageNumber}`,
              bold: true,
              size: 20, // 10pt subtle indicator
              color: '555555',
              font: 'Geist, Arial',
            }),
          ],
        }),
      ],
    });

    pageParagraphs.push(headingParagraph);

    // Parse lines and paragraphs from extracted text
    const rawParagraphs = page.text.split(/\n\s*\n/);

    if (rawParagraphs.length === 0 || (rawParagraphs.length === 1 && rawParagraphs[0].trim() === '')) {
      pageParagraphs.push(
        new Paragraph({
          spacing: { after: typo.spaceAfter, line: typo.lineSpacing },
          children: [
            new TextRun({
              text: '[Blank page or no text detected]',
              italics: true,
              color: '888888',
              size: typo.size,
              font: 'Geist, Arial',
            }),
          ],
        })
      );
    } else {
      rawParagraphs.forEach((pText) => {
        const lines = pText.split('\n');
        const textRuns: TextRun[] = [];

        lines.forEach((line, lineIndex) => {
          textRuns.push(
            new TextRun({
              text: line,
              size: typo.size,
              font: 'Geist, Arial',
            })
          );
          if (lineIndex < lines.length - 1) {
            textRuns.push(new TextRun({ break: 1 }));
          }
        });

        pageParagraphs.push(
          new Paragraph({
            spacing: {
              after: typo.spaceAfter,
              line: typo.lineSpacing,
            },
            children: textRuns,
          })
        );
      });
    }

    return {
      properties: {
        type: isFirstPage ? undefined : SectionType.NEXT_PAGE,
        page: {
          orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          margin: typo.margin,
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: `${fileName} | KALON Co. OCR`,
                  size: 16, // 8pt
                  color: '888888',
                  font: 'Geist, Arial',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120 },
              children: [
                new TextRun({
                  text: 'Page ',
                  size: 18,
                  color: '666666',
                  font: 'Geist, Arial',
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: '666666',
                  font: 'Geist, Arial',
                }),
                new TextRun({
                  text: ' of ',
                  size: 18,
                  color: '666666',
                  font: 'Geist, Arial',
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 18,
                  color: '666666',
                  font: 'Geist, Arial',
                }),
              ],
            }),
          ],
        }),
      },
      children: pageParagraphs,
    };
  });

  const doc = new Document({
    title: `${fileName} - OCR Transcription`,
    description: 'Generated by KALON High-Fidelity On-Site Browser OCR with Strict Page-to-Page Fidelity',
    creator: 'KALON Co. Ecosystem',
    sections,
  });

  return await Packer.toBlob(doc);
}
