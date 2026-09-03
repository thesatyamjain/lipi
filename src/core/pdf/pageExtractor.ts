import * as pdfjsLib from 'pdfjs-dist';
import * as UTIF from 'utif';

// Configure workerSrc using local bundled worker with jsDelivr CDN fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
}

export interface RenderedPageResult {
  pageNumber: number;
  thumbnailUrl: string;
  highResBlob?: Blob;
  highResUrl?: string;
  width: number;
  height: number;
}

/**
 * Loads a PDF document and returns total page count without rendering all canvases upfront.
 */
export async function loadPdfDocument(arrayBuffer: ArrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/cmaps/`,
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Renders a single PDF page to a canvas and returns low-res thumbnail and/or high-res data for OCR.
 * @param pdfDoc Loaded PDFDocumentProxy
 * @param pageNumber 1-indexed page number
 * @param options scale config
 */
export async function renderPdfPage(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  options: {
    thumbnailScale?: number;
    highResScale?: number;
    needHighRes?: boolean;
  } = {}
): Promise<RenderedPageResult> {
  const page = await pdfDoc.getPage(pageNumber);
  const { thumbnailScale = 0.35, highResScale = 2.0, needHighRes = false } = options;

  // 1. Render thumbnail for memory-safe grid display
  const thumbViewport = page.getViewport({ scale: thumbnailScale });
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = Math.floor(thumbViewport.width);
  thumbCanvas.height = Math.floor(thumbViewport.height);
  const thumbCtx = thumbCanvas.getContext('2d', { alpha: false });

  if (thumbCtx) {
    thumbCtx.fillStyle = '#ffffff';
    thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
    await page.render({
      canvasContext: thumbCtx,
      viewport: thumbViewport,
    }).promise;
  }

  const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.65);
  // Clean up thumbnail canvas
  thumbCanvas.width = 0;
  thumbCanvas.height = 0;

  let highResBlob: Blob | undefined;
  let highResUrl: string | undefined;

  // 2. High-res render for OCR / detailed side-by-side inspection
  if (needHighRes) {
    const highViewport = page.getViewport({ scale: highResScale });
    const highCanvas = document.createElement('canvas');
    highCanvas.width = Math.floor(highViewport.width);
    highCanvas.height = Math.floor(highViewport.height);
    const highCtx = highCanvas.getContext('2d', { alpha: false });

    if (highCtx) {
      highCtx.fillStyle = '#ffffff';
      highCtx.fillRect(0, 0, highCanvas.width, highCanvas.height);
      await page.render({
        canvasContext: highCtx,
        viewport: highViewport,
      }).promise;

      highResBlob = await new Promise<Blob>((resolve) => {
        highCanvas.toBlob((blob) => resolve(blob || new Blob()), 'image/png');
      });
      highResUrl = URL.createObjectURL(highResBlob);
    }

    highCanvas.width = 0;
    highCanvas.height = 0;
  }

  return {
    pageNumber,
    thumbnailUrl,
    highResBlob,
    highResUrl,
    width: Math.floor(thumbViewport.width / thumbnailScale),
    height: Math.floor(thumbViewport.height / thumbnailScale),
  };
}

/**
 * Handles single image files (PNG, JPG, WebP) directly without PDF parsing.
 */
export async function processImageFile(file: File): Promise<RenderedPageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // Create low-res thumbnail
        const thumbCanvas = document.createElement('canvas');
        const maxThumbDim = 280;
        const scale = Math.min(1, maxThumbDim / Math.max(width, height));
        thumbCanvas.width = Math.floor(width * scale);
        thumbCanvas.height = Math.floor(height * scale);
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        }
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

        thumbCanvas.width = 0;
        thumbCanvas.height = 0;

        const highResUrl = URL.createObjectURL(file);

        // Normalize small scans for optimal character height in OCR
        const maxDim = Math.max(width, height);
        if (maxDim < 1600 && maxDim > 100) {
          const upScale = Math.min(2.5, 2000 / maxDim);
          const upCanvas = document.createElement('canvas');
          upCanvas.width = Math.round(width * upScale);
          upCanvas.height = Math.round(height * upScale);
          const upCtx = upCanvas.getContext('2d');
          if (upCtx) {
            upCtx.imageSmoothingEnabled = true;
            upCtx.imageSmoothingQuality = 'high';
            upCtx.drawImage(img, 0, 0, upCanvas.width, upCanvas.height);
            upCanvas.toBlob((upBlob) => {
              upCanvas.width = 0;
              upCanvas.height = 0;
              resolve({
                pageNumber: 1,
                thumbnailUrl,
                highResBlob: upBlob || file,
                highResUrl,
                width,
                height,
              });
            }, 'image/png');
            return;
          }
        }

        resolve({
          pageNumber: 1,
          thumbnailUrl,
          highResBlob: file,
          highResUrl,
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error('Failed to decode image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export interface TiffDocumentInfo {
  numPages: number;
  renderPage: (pageNumber: number) => Promise<RenderedPageResult>;
}

/**
 * Decodes and processes multi-page TIFF files completely in-browser.
 */
export async function loadTiffDocument(arrayBuffer: ArrayBuffer): Promise<TiffDocumentInfo> {
  const ifds = UTIF.decode(arrayBuffer);
  const numPages = ifds.length;

  return {
    numPages,
    renderPage: async (pageNumber: number): Promise<RenderedPageResult> => {
      const ifd = ifds[pageNumber - 1];
      UTIF.decodeImage(arrayBuffer, ifd);
      const rgba = UTIF.toRGBA8(ifd);

      const canvas = document.createElement('canvas');
      canvas.width = ifd.width;
      canvas.height = ifd.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      const imgData = ctx.createImageData(ifd.width, ifd.height);
      imgData.data.set(rgba);
      ctx.putImageData(imgData, 0, 0);

      // Thumbnail
      const maxThumbDim = 280;
      const scale = Math.min(1, maxThumbDim / Math.max(ifd.width, ifd.height));
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = Math.floor(ifd.width * scale);
      thumbCanvas.height = Math.floor(ifd.height * scale);
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      }
      const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.65);
      thumbCanvas.width = 0;
      thumbCanvas.height = 0;

      const highResBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
      });
      const highResUrl = URL.createObjectURL(highResBlob);

      canvas.width = 0;
      canvas.height = 0;

      return {
        pageNumber,
        thumbnailUrl,
        highResBlob,
        highResUrl,
        width: ifd.width,
        height: ifd.height,
      };
    },
  };
}

