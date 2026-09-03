import type { PageData } from '../../types/index.ts';

export function generateStandaloneHtmlViewer(fileName: string, pages: PageData[]): Blob {
  const pagesJson = JSON.stringify(
    pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      confidence: p.confidence,
      script: p.script || 'Auto',
      isAiRefined: p.isAiRefined,
    }))
  );

  const initialPage = pages[0] || {
    pageNumber: 1,
    text: '',
    confidence: 0,
    script: 'Latin',
    isAiRefined: false,
  };
  const initialOptions = pages
    .map((p, idx) => `<option value="${idx}">Page ${p.pageNumber} of ${pages.length}</option>`)
    .join('\n        ');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fileName)} &mdash; LIPI Page-by-Page Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: #12151e;
      --border: #242938;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #c59b27;
      --accent-muted: rgba(197, 155, 39, 0.15);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Geist', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    header {
      height: 64px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      background: #0d0f15;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #d4af37, #8a6c1e);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #000;
      font-size: 13px;
    }
    .doc-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    select, button, input {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 7px 14px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      transition: all 0.15s ease;
    }
    select:hover, button:hover {
      border-color: #3f475d;
      background: #181d2a;
    }
    button.primary {
      background: var(--accent);
      color: #000;
      font-weight: 600;
      border-color: var(--accent);
    }
    button.primary:hover {
      filter: brightness(1.1);
    }
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-width: 960px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      overflow: hidden;
    }
    .page-card {
      flex: 1;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .card-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      background: #151822;
    }
    .card-badges {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      font-family: 'Geist Mono', monospace;
    }
    .badge {
      padding: 3px 8px;
      border-radius: 4px;
      background: #1e2433;
      color: var(--muted);
      border: 1px solid #2e3549;
    }
    .badge.green { color: #4ade80; border-color: rgba(74, 222, 128, 0.3); background: rgba(74, 222, 128, 0.08); }
    .badge.gold { color: #facc15; border-color: rgba(250, 204, 21, 0.3); background: rgba(250, 204, 21, 0.08); }
    .text-content {
      flex: 1;
      padding: 32px 40px;
      overflow-y: auto;
      white-space: pre-wrap;
      line-height: 1.7;
      font-size: 15px;
      color: #e2e8f0;
      font-family: 'Geist', sans-serif;
    }
    footer {
      padding: 12px 24px;
      text-align: center;
      font-size: 12px;
      color: var(--muted);
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="logo">L</div>
      <div>
        <div class="doc-title">${escapeHtml(fileName)}</div>
        <div style="font-size: 11px; color: var(--muted)">Lipi Dedicated Single-Page Viewer Window</div>
      </div>
    </div>
    <div class="controls">
      <button id="btnPrev" onclick="navigate(-1)">&larr; Previous</button>
      <select id="pageSelect" onchange="jumpToPage(this.value)">
        ${initialOptions}
      </select>
      <button id="btnNext" onclick="navigate(1)">Next &rarr;</button>
      <button class="primary" onclick="copyCurrentText()">Copy Page Text</button>
    </div>
  </header>

  <main>
    <div class="page-card">
      <div class="card-bar">
        <div style="font-weight: 600; font-size: 14px;" id="pageHeading">Page ${initialPage.pageNumber} of ${pages.length}</div>
        <div class="card-badges">
          <span class="badge" id="scriptBadge">Script: ${initialPage.script || 'Latin'}</span>
          <span class="badge ${initialPage.confidence >= 80 ? 'green' : 'gold'}" id="confBadge">Confidence: ${initialPage.confidence}%</span>
          <span class="badge gold" id="aiBadge" style="${initialPage.isAiRefined ? '' : 'display:none;'}">AI Refined</span>
        </div>
      </div>
      <div class="text-content" id="textContent">${escapeHtml(initialPage.text)}</div>
    </div>
  </main>

  <footer>
    Strict 1:1 Page-Fidelity Extraction &bull; Lipi High-Precision Bharatiya &amp; Global Processing
  </footer>

  <script>
    const pages = ${pagesJson};
    let currentIndex = 0;
    const selectEl = document.getElementById('pageSelect');

    function renderPage() {
      const page = pages[currentIndex];
      selectEl.value = currentIndex;
      document.getElementById('pageHeading').textContent = 'Page ' + page.pageNumber + ' of ' + pages.length;
      document.getElementById('textContent').textContent = page.text || '[Blank page]';
      document.getElementById('scriptBadge').textContent = 'Script: ' + (page.script || 'Latin');
      
      const confBadge = document.getElementById('confBadge');
      confBadge.textContent = 'Confidence: ' + page.confidence + '%';
      confBadge.className = 'badge ' + (page.confidence >= 80 ? 'green' : 'gold');

      const aiBadge = document.getElementById('aiBadge');
      aiBadge.style.display = page.isAiRefined ? 'inline-block' : 'none';
      aiBadge.className = 'badge gold';

      document.getElementById('btnPrev').disabled = currentIndex === 0;
      document.getElementById('btnNext').disabled = currentIndex === pages.length - 1;
    }

    function navigate(delta) {
      const newIdx = currentIndex + delta;
      if (newIdx >= 0 && newIdx < pages.length) {
        currentIndex = newIdx;
        renderPage();
      }
    }

    function jumpToPage(val) {
      currentIndex = parseInt(val, 10);
      renderPage();
    }

    function copyCurrentText() {
      const text = pages[currentIndex]?.text || '';
      navigator.clipboard.writeText(text);
      alert('Page ' + pages[currentIndex].pageNumber + ' copied to clipboard');
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });

    renderPage();
  </script>
</body>
</html>`;

  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
