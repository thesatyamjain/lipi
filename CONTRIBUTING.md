# Contributing to Lipi OCR

Thank you for your interest in contributing to Lipi OCR! We welcome improvements, bug reports, and features that align with our core mission: **100% client-side privacy, regional script accuracy, and strict 1:1 page fidelity**.

---

## Development Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/lipi-ocr.git
   cd lipi-ocr
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The dev server runs at `http://localhost:5173/` with Hot Module Replacement (HMR).

---

## Architecture Overview

- `src/core/pdf/`: Document ingestion, PDF streaming rasterization via `pdfjs-dist`, TIFF decoding via `utif`, and high-res canvas management.
- `src/core/ocr/`:
  - `workerPool.ts`: WebAssembly Tesseract worker concurrency manager.
  - `languageDetector.ts` & `bharatiyaLanguages.ts`: Unicode character block classifier supporting all 22 official languages.
  - `aiRefiner.ts`: Layer 2 Multimodal AI Vision refinement via Gemini Flash API cascade.
  - `imagePreprocessor.ts`: Adaptive binarization, contrast adjustment, and canvas clean-up.
- `src/core/export/`:
  - `docxExporter.ts`: Section-level OpenXML Word exporter with `SectionType.NEXT_PAGE` and dynamic landscape orientation.
  - `htmlViewerExporter.ts`: Standalone single-file interactive reader window.
- `src/components/`:
  - `header/`: Settings modal, status indicators.
  - `upload/`: DropZone file ingestion and bilingual demo loader.
  - `processing/`: Real-time throughput, lane telemetry, and progress bar.
  - `viewer/`: Side-by-side inspection workspace with pan/zoom and text editor.
  - `export/`: Docked export command bar.

---

## Testing & Verification

Before submitting changes, ensure all tests pass and the production bundle builds without errors:

```bash
# Run the verification test suite
npm test

# Run TypeScript type check and Vite production build
npm run build
```

---

## Pull Request Guidelines

1. Create a feature branch (`git checkout -b feature/your-feature-name`).
2. Keep changes focused and atomic.
3. Ensure `npm test` and `npm run build` pass cleanly.
4. Submit a pull request detailing the problem solved and testing steps performed.
