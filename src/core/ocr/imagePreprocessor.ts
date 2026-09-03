/**
 * Client-Side Image Preprocessing Pipeline for Enhanced OCR Accuracy
 * Applies adaptive contrast stretching, grayscale luminance normalization,
 * and high-frequency edge unsharp masking to enhance character stroke clarity
 * and eliminate scanner haze, shadows, and low-contrast paper noise.
 */

export interface PreprocessOptions {
  contrastStretch?: boolean;
  sharpen?: boolean;
  binarize?: boolean;
  targetDpi?: number;
}

/**
 * Preprocesses an image source to maximize Tesseract & Vision OCR recognition rates.
 */
export async function preprocessImageForOcr(
  source: Blob | string | HTMLCanvasElement,
  options: PreprocessOptions = {}
): Promise<Blob> {
  // Guard for non-browser environments (e.g. Node CLI tests)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return source instanceof Blob ? source : new Blob();
  }

  const {
    contrastStretch = true,
    sharpen = true,
    binarize = false,
  } = options;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (source instanceof HTMLCanvasElement) {
    canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Blob();
    ctx.drawImage(source, 0, 0);
  } else {
    // Decode Blob or URL to ImageBitmap or HTMLImageElement
    let imgBitmap: ImageBitmap | HTMLImageElement;
    if (source instanceof Blob && typeof createImageBitmap !== 'undefined') {
      try {
        imgBitmap = await createImageBitmap(source);
      } catch {
        imgBitmap = await loadHtmlImage(source);
      }
    } else {
      imgBitmap = await loadHtmlImage(source);
    }

    canvas = document.createElement('canvas');
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Blob();

    ctx.drawImage(imgBitmap, 0, 0);
    if ('close' in imgBitmap && typeof imgBitmap.close === 'function') {
      imgBitmap.close();
    }
  }

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // Step 1: Perceptual Grayscale Conversion (Rec. 601 Luma: 0.299R + 0.587G + 0.114B)
  // and compute luminance histogram for adaptive auto-level contrast stretching
  const luma = new Uint8Array(totalPixels);
  const hist = new Uint32Array(256);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const y = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
    luma[p] = y;
    hist[y]++;
  }

  // Step 2: Adaptive Contrast Stretching (Auto-Levels)
  // Discard 1.5% darkest noise and 2% brightest scanner background
  let lowThreshold = 0;
  let highThreshold = 255;

  if (contrastStretch) {
    const lowCutoff = Math.floor(totalPixels * 0.015);
    const highCutoff = Math.floor(totalPixels * 0.98);

    let accumulator = 0;
    for (let i = 0; i < 256; i++) {
      accumulator += hist[i];
      if (accumulator >= lowCutoff) {
        lowThreshold = i;
        break;
      }
    }

    accumulator = 0;
    for (let i = 0; i < 256; i++) {
      accumulator += hist[i];
      if (accumulator >= highCutoff) {
        highThreshold = Math.max(lowThreshold + 10, i);
        break;
      }
    }
  }

  const range = highThreshold - lowThreshold || 1;
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    if (i <= lowThreshold) {
      lut[i] = 0;
    } else if (i >= highThreshold) {
      lut[i] = 255;
    } else {
      lut[i] = Math.min(255, Math.max(0, Math.round(((i - lowThreshold) / range) * 255)));
    }
  }

  // Apply contrast LUT back to luminance buffer
  for (let p = 0; p < totalPixels; p++) {
    luma[p] = lut[luma[p]];
  }

  // Step 3: High-Frequency Unsharp Mask (3x3 Kernel)
  // Sharpens small Indic diacritics (matras, halants, nuktas) and fine letter strokes
  if (sharpen && width > 2 && height > 2) {
    const sharpened = new Uint8Array(totalPixels);
    // Copy borders
    sharpened.set(luma.subarray(0, width), 0);
    sharpened.set(luma.subarray(totalPixels - width), totalPixels - width);

    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      const prevRow = (y - 1) * width;
      const nextRow = (y + 1) * width;

      // Set row edges
      sharpened[rowOffset] = luma[rowOffset];
      sharpened[rowOffset + width - 1] = luma[rowOffset + width - 1];

      for (let x = 1; x < width - 1; x++) {
        const center = luma[rowOffset + x];
        const up = luma[prevRow + x];
        const down = luma[nextRow + x];
        const left = luma[rowOffset + x - 1];
        const right = luma[rowOffset + x + 1];

        // Laplacian kernel: 5 * center - (up + down + left + right)
        const val = 5 * center - (up + down + left + right);
        sharpened[rowOffset + x] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
    }
    luma.set(sharpened);
  }

  // Step 4: Optional High-Contrast Binarization
  if (binarize) {
    for (let p = 0; p < totalPixels; p++) {
      luma[p] = luma[p] < 128 ? 0 : 255;
    }
  }

  // Write enhanced grayscale back to RGBA ImageData
  for (let p = 0, i = 0; p < totalPixels; p++, i += 4) {
    const v = luma[p];
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);

  // Return lossless PNG Blob to preserve crisp pixel boundaries
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      // Clean up canvas
      canvas.width = 0;
      canvas.height = 0;
      resolve(blob || new Blob());
    }, 'image/png');
  });
}

/**
 * Loads an image from Blob or URL via HTMLImageElement fallback
 */
function loadHtmlImage(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    img.onload = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
