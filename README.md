# Lipi OCR — On-Site High-Fidelity Bharatiya Document Processing Engine

> **100% Client-Side Document Intelligence**  
> Your files never leave your browser. Scanned PDFs, multi-page TIFFs, and images are processed locally using WebAssembly and client-side hardware multi-threading.

---

## Overview

Lipi OCR is a browser-native document extraction and layout reconstruction suite engineered specifically for multi-page documents, complex regional scripts, and legal/regulatory records.

Most web OCR utilities compromise either on **privacy** (uploading sensitive legal and financial documents to remote cloud servers) or on **layout fidelity** (flattening pages into continuous text reflow that destroys the original page structure when exported to Word).

Lipi OCR solves both problems with two foundational architectural guarantees:

1. **Zero-Server Execution:** All document rasterization, WebAssembly OCR workers, and document assembly execute 100% inside your local browser memory sandbox.
2. **Strict 1:1 Page-to-Page Fidelity:** Input Page *N* maps directly to Output Word (.docx) Page *N*, preserving page breaks, orientation (portrait vs landscape), margins, and headings without reflow bleed.

---

## Core Capabilities

### 1. Full Pan-Bharatiya Script Coverage
Supports all 22 official Eighth Schedule languages of the Republic of India with automated Unicode script detection:

- **Devanagari:** Hindi, Marathi, Sanskrit, Nepali, Bodo, Dogri, Konkani, Maithili
- **Bengali & Assamese Script:** Bengali, Assamese, Manipuri (Meitei)
- **Dravidian Scripts:** Tamil, Telugu, Kannada, Malayalam
- **Gujarati Script:** Gujarati
- **Gurmukhi Script:** Punjabi
- **Odia Script:** Odia
- **Perso-Arabic Script:** Urdu, Kashmiri, Sindhi
- **Santali Script:** Ol Chiki
- **Latin:** English and mixed multilingual records

### 2. Dual-Engine Architecture
Combines fast local character extraction with intelligent vision model refinement:

- **Layer 1 (Base WASM OCR):** Parallel Tesseract.js workers run directly on your CPU cores via WebAssembly, extracting raw text and bounding boxes locally.
- **Layer 2 (Multimodal AI Refiner):** Pages with complex ligatures, damaged scans, or low confidence (<75%) can be optionally cross-verified and reconstructed via Google Gemini Multimodal Vision API (with automatic fallback cascade: `gemini-3.6-flash` -> `gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-1.5-flash`). API keys are kept strictly in local `localStorage`.

### 3. Strict 1:1 Word (.docx) Page Fidelity
- **OpenXML Section Breaks:** Every input page is encapsulated in an isolated OpenXML document section (`SectionType.NEXT_PAGE`).
- **Dynamic Orientation:** Automatically detects landscape scans (`width > height`) and assigns `PageOrientation.LANDSCAPE` to that specific page in Word while keeping portrait pages unaffected.
- **Adaptive Typography:** Dense pages automatically scale typography (down to 8.5pt) and tighten margins (720 dxa) to prevent paragraph spillover across physical page boundaries.
- **Word Navigation Hierarchy:** Generates bookmark structures and Heading levels compatible with Word's native Navigation Pane.

### 4. Broad Input & Export Formats
- **Input Formats:** Scanned PDF (1 to 300+ pages with streaming memory management), Multi-page TIFF (`.tif`/`.tiff`), PNG, JPG, JPEG, and WebP.
- **Export Formats:**
  - **Microsoft Word (.docx):** 1:1 Section-level page fidelity with auto-fit margins.
  - **Standalone Interactive HTML Viewer (.html):** Single-file offline reader window with dropdown page selector and embedded styles.
  - **Markdown (.md):** Structured headings and page delimitations.
  - **Plain Text (.txt):** Delimited with explicit page boundary tags.

---

## Architecture

```
[Input Document (PDF / TIFF / Image)]
                 |
                 v
   +---------------------------+
   | Client-Side Document      |
   | Streaming Extractor       |
   +---------------------------+
                 |
                 +-------------------+
                 |                   |
                 v                   v
      [High-Res Page Blob]    [Low-Res Thumbnail]
                 |                   |
                 v                   v
   +---------------------------+     |
   | Unicode Script & Language |     |
   | Classifier                |     |
   +---------------------------+     |
                 |                   |
                 v                   |
   +---------------------------+     |
   | Parallel WASM Worker Pool |     |
   | (Hardware Concurrency)    |     |
   +---------------------------+     |
                 |                   |
                 v                   |
       [Raw Base OCR Draft]          |
                 |                   |
                 +---------+---------+
                           |
                           v
           +-------------------------------+
           | Layer 2: Gemini Flash AI      |  (Optional user-enabled)
           | Multimodal Vision Refinement  |
           +-------------------------------+
                           |
                           v
           +-------------------------------+
           | Strict 1:1 Page Exporter      |
           | (DOCX / HTML / MD / TXT)      |
           +-------------------------------+
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/lipi-ocr.git

# Navigate into project directory
cd lipi-ocr

# Install dependencies
npm install
```

### Development Server

Start the local Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Running Tests

Run the built-in automated test and verification suite:

```bash
npm test
```

### Production Build

Create an optimized, air-gapped production build:

```bash
npm run build
```

The output will be placed in the `dist/` directory and can be hosted on any static web server (Cloudflare Pages, Vercel, Netlify, GitHub Pages, or an offline intranet server).

---

## Privacy & Security

- **Zero Remote Storage:** Your documents are never uploaded to any remote server or third-party database. All document analysis happens in client memory.
- **Air-Gapped Operation:** The base WASM engine and PDF worker are bundled locally (`dist/assets/`). Once loaded, base OCR functions completely offline.
- **API Key Storage:** When using Layer 2 AI refinement, your Google Gemini API key is stored exclusively in your browser's private `localStorage` and sent directly to Google's API endpoint over HTTPS.

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, code architecture, and testing instructions.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
