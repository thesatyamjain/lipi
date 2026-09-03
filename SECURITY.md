# Security Policy

## Security & Privacy Model

Lipi OCR is engineered with a strict **privacy-first, client-side architecture**:

1. **Zero Server Uploads:** Document parsing (PDF, TIFF, images), text recognition, and export generation execute entirely within your local browser's WebAssembly sandbox. Documents are never transmitted to, processed on, or stored in any remote server.
2. **Local Credential Storage:** When using the optional Layer 2 AI Vision refinement, your Google Gemini API key is stored exclusively in your browser's private `localStorage`. It is sent directly to Google's official Gemini endpoint (`generativelanguage.googleapis.com`) over HTTPS from your client, without passing through any intermediate proxy.
3. **Air-Gapped Operation:** The core WASM OCR engine, language models, and PDF workers can run completely offline without an active internet connection once loaded.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | Yes                |

---

## Reporting a Vulnerability

If you discover a security vulnerability in Lipi OCR, please report it responsibly:

- **Do not disclose vulnerabilities publicly via GitHub issues.**
- Please report security concerns by creating a confidential GitHub Advisory or contacting the maintainers directly.
- Include detailed steps to reproduce the issue, along with browser version and environment details.

We will acknowledge receipt within 48 hours and provide updates until resolution.
