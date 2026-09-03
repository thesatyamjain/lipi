# Lipi OCR — Complete User Guide

> **On-Site High-Fidelity Bharatiya Document Processing**  
> *Private. Multi-Threaded. Strict 1:1 Page-to-Page Fidelity.*

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Quick Start (30 Seconds)](#2-quick-start-30-seconds)
3. [Supported File Formats](#3-supported-file-formats)
4. [Pan-Bharatiya Language Support](#4-pan-bharatiya-language-support)
5. [The Dual-Layer "Cocktail" Engine (AI Vision)](#5-the-dual-layer-cocktail-engine-ai-vision)
6. [Interactive Review & Editing](#6-interactive-review--editing)
7. [Exporting Documents](#7-exporting-documents)
8. [Performance Tuning & Concurrency](#8-performance-tuning--concurrency)
9. [Privacy & Security Architecture](#9-privacy--security-architecture)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. Overview & Philosophy

Most optical character recognition (OCR) tools suffer from three fundamental problems:
1. **Privacy Risk**: They upload sensitive legal, financial, or personal documents to third-party cloud servers.
2. **Page Spoilage**: During export to Word (`.docx`), text reflow causes 1 input page to spill across 2 or 3 pages, destroying court exhibits, legal citations, and official indices.
3. **Regional Script Breakdown**: Single-model engines frequently corrupt Indic vowel signs (*matras*), conjunct consonants (*samyuktaksharas*), and diacritics.

**Lipi OCR** is engineered specifically to eliminate these three issues:
- **100% Client-Side Sandbox**: Decodes and recognizes files directly inside your browser memory. Your documents never leave your computer.
- **Strict 1:1 Page Fidelity**: Output Word documents preserve page counts strictly—Page 15 of your scan is guaranteed to be Page 15 in your exported Word file.
- **Dual-Layer Cocktail Pipeline**: Combines local WebAssembly processing with context-aware multimodal vision AI (Gemini 2.5 Flash) to reconstruct degraded or complex Indian scripts.

---

## 2. Quick Start (30 Seconds)

1. **Launch Lipi OCR** in your browser.
2. **Choose an Action**:
   - **Upload**: Drag and drop any PDF, multi-page TIFF, or image file directly into the drop zone.
   - **Demo**: Click **"Load Bilingual Specimen"** to test the engine immediately without having a file ready.
3. **Watch Real-Time Processing**:
   - Lipi distributes pages across your computer's CPU cores in parallel.
   - A live progress dashboard displays active worker threads, page throughput, and real-time script recognition.
4. **Review & Export**:
   - Inspect pages in the side-by-side viewer.
   - Click **"Export to Word (.docx)"** on the bottom bar to download your formatted document.

---

## 3. Supported File Formats

| Format | Extension | Capabilities & Recommendations |
| :--- | :--- | :--- |
| **PDF Documents** | `.pdf` | Multi-page documents up to 300+ pages. Decoded page-by-page to prevent browser RAM exhaustion. |
| **Multi-Page TIFF** | `.tiff`, `.tif` | Standard archival and government scanner format. Extracted and rendered per frame. |
| **High-Res Images** | `.jpg`, `.jpeg`, `.png`, `.webp` | Single or batch scanned pages. Ideal DPI is 150 to 300 DPI for best recognition. |

---

## 4. Pan-Bharatiya Language Support

Lipi OCR supports **all 22 official languages** listed in the Eighth Schedule of the Constitution of India, plus English:

| Script Family | Supported Languages |
| :--- | :--- |
| **Devanagari** | हिन्दी (Hindi), मराठी (Marathi), संस्कृतम् (Sanskrit), नेपाली (Nepali), बड़ो (Bodo), डोगरी (Dogri), कोंकणी (Konkani), मैथिली (Maithili) |
| **Bengali & Assamese** | বাংলা (Bengali), অসমীया (Assamese), মৈতৈলোন্ (Manipuri / Meitei) |
| **Dravidian** | தமிழ் (Tamil), తెలుగు (Telugu), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam) |
| **Gujarati** | ગુજરાતી (Gujarati) |
| **Gurmukhi** | ਪੰਜਾਬੀ (Punjabi) |
| **Odia** | ଓଡ଼ିଆ (Odia) |
| **Perso-Arabic** | اردو (Urdu), سنڌي (Sindhi), कॉशुर / کٲشُر (Kashmiri) |
| **Ol Chiki** | ᱥᱟᱱᱛᱟᱲᱤ (Santali) |
| **Latin** | English (Default bilingual partner for Indian legal/official files) |

### How to Select or Change Language:
1. Click the **Settings (⚙️)** icon in the top header.
2. In **Language & Script Configuration**, choose:
   - **✨ Auto-Detect Bharatiya Script per Page**: Automatically analyzes each page's Unicode characters and applies the appropriate model.
   - **🇮🇳 Bilingual Pairs (English + Regional)**: e.g., `English + हिन्दी`, `English + தமிழ்`, `English + বাংলা`. Best for government gazettes, court filings, and bilingual invoices.
   - **📜 Monolingual Bharatiya Languages**: Tailored models for documents written exclusively in a single regional script.
   - **🌐 English Only**: Fast Latin-only processing.
3. Click **Save Configuration**.

---

## 5. The Dual-Layer "Cocktail" Engine (AI Vision)

When working with faded print, old judicial stamps, xerox copies, or intricate Indic ligatures, base OCR can produce low-confidence text. Lipi's **Cocktail Engine** uses a two-tier pipeline:

### How It Operates:
1. **Layer 1 (Local WASM)**: Runs Tesseract WebAssembly locally at zero cost and ultra-low latency, identifying character bounding boxes and base text.
2. **Confidence Benchmark**: If a page scores below your set threshold (e.g. 75%), Layer 2 steps in.
3. **Layer 2 (Gemini 2.5 Flash Multimodal Vision)**: The browser sends the high-res canvas together with the rough draft to Gemini 2.5 Flash, which visually reconstructs missing matras, fixes fractured words, and restores tabular alignments.

### Setting Up AI Refinement:
1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2. In Lipi, open **Settings (⚙️)**.
3. Toggle **Layer 2 Multimodal AI Refinement** to **ON**.
4. Paste your key into the **Google Gemini API Key** box.
5. Set your **AI Refinement Threshold** slider:
   - **40%**: Aggressive (only calls AI for severely damaged or broken pages).
   - **75% (Recommended)**: Balanced (calls AI for low-to-medium confidence pages).
   - **95%**: Premium Fidelity (calls AI on almost all pages for maximum publication-grade accuracy).
6. Click **Save Configuration**.

### Triggering AI Refinement:
- **Automatic**: Occurs during initial document processing if confidence is below your threshold.
- **Manual Single-Page**: Click the **"Refine with AI"** (✨) button beside any page's text box.
- **Batch Refine**: Click **"Batch Refine Low-Confidence"** above the thumbnail grid.

---

## 6. Interactive Review & Editing

Once a document is loaded, Lipi opens an ergonomic review studio:

- **Thumbnail Grid**: Click any thumbnail to jump to that page. Badges indicate status (`Done`, `AI Refined`, confidence score).
- **Side-by-Side Split View**:
  - **Left**: Original scanned document canvas with high-resolution detail.
  - **Right**: Editable transcription editor with real-time word and line counts.
- **Keyboard Shortcuts**:
  - `Arrow Left (←)`: Jump to the previous page.
  - `Arrow Right (→)`: Jump to the next page.
  *(Disabled automatically while typing in the text editor)*.
- **Direct Editing**: You can freely edit, fix typos, or format text directly in the right-hand panel before exporting.

---

## 7. Exporting Documents

Lipi provides three zero-loss export formats docked on the command bar:

### 1. Microsoft Word (.docx) — Strict 1:1 Page Fidelity
- **Page Guarantee**: Hard OpenXML page section breaks ensure `Input Page N == Output Page N`.
- **Adaptive Auto-Fit Typography**: Dynamically adjusts font size and paragraph spacing for dense pages to eliminate overflow.
- **Word Bookmarks**: Generates native Word sidebar bookmarks (`Page 1`, `Page 2`...) for effortless navigation in Microsoft Word and LibreOffice.

### 2. Standalone Offline HTML Viewer (.html)
- Exports a complete, self-contained single-page web app.
- Contains the full document text, page dropdown, confidence badges, and one-click copy buttons.
- Opens instantly in any web browser without internet connection or dependencies.

### 3. Plain Text (.txt)
- Clean, unformatted text export with standard ASCII page markers (`--- Page N ---`).

---

## 8. Performance Tuning & Concurrency

Lipi automatically reads your device's CPU hardware concurrency via `navigator.hardwareConcurrency`.

- **Concurrency Slider**: Located in **Settings (⚙️)** under **Web Worker Concurrency**.
- **Recommended Settings**:
  - **Quad-Core Laptops (4 threads)**: 2 to 4 workers.
  - **Modern 8-Core Desktops / Laptops (8 threads)**: 4 to 6 workers.
  - **High-End Workstations (12+ threads)**: 6 to 8 workers.
- *Tip: Increasing worker count speeds up multi-page processing significantly, but consumes more RAM.*

---

## 9. Privacy & Security Architecture

Lipi was designed from the ground up for air-gapped, high-confidentiality workflows (legal filings, medical case sheets, financial audits):

- **No Remote Application Server**: The Lipi web application is static. There is no backend database or processing server.
- **No Document Uploads**: Your files are decoded in browser RAM and canvas elements.
- **Local Settings Storage**: Gemini API keys and preference configs are stored exclusively in your local browser's `localStorage` (`lipi_ocr_config`).
- **Direct-to-API Option**: When Layer 2 AI is active, the browser communicates directly and encrypted via HTTPS with Google's API endpoint without passing through any intermediate proxy.

---

## 10. Troubleshooting & FAQs

#### Q: How do I process scanned documents in Tamil, Telugu, or Bengali?
**A:** Open **Settings (⚙️)** and either select the specific bilingual pair (e.g. `English + தமிழ்`) or select `Auto-Detect Bharatiya Script per Page`. Lipi will load the dedicated model and detect the script automatically.

#### Q: Why did some text wrap onto an extra page in Microsoft Word?
**A:** Ensure **Strict 1:1 Auto-Fit Typography** is checked in **Settings (⚙️)**. For unusually dense pages, auto-fit slightly tightens line spacing to keep every page locked to its 1:1 boundary.

#### Q: Does Lipi work offline?
**A:** Yes! Once the website assets and Tesseract language model are cached by your browser, Layer 1 WASM processing and DOCX export function completely offline without internet connectivity.

#### Q: Can I edit the text before exporting?
**A:** Yes. Simply click into the transcription box on the right half of the side-by-side viewer and make any edits. All modifications are instantly included in your exported `.docx`, `.html`, and `.txt` files.
