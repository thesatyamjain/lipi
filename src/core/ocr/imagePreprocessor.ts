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
  deskew?: boolean;
  targetDpi?: number;
  documentMode?: 'printed' | 'handwritten' | 'mixed';
  sauvolaK?: number;
  sauvolaR?: number;
}

export interface PreprocessResult {
  blob: Blob;
  skewAngle: number;
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
    documentMode = 'printed',
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

  // Deepen faint ballpoint pen, ink wash, and pencil strokes in handwriting mode
  if (documentMode === 'handwritten') {
    for (let p = 0; p < totalPixels; p++) {
      const v = luma[p];
      if (v < 210) {
        luma[p] = Math.max(0, Math.round(v * 0.88));
      }
    }
  }

  // Step 3: Additive Unsharp Mask (box-blur approximation + high-freq boost)
  // amount=0.6 sharpens Indic diacritics/matras without destroying stroke gradients.
  // Additive USM: output = clamp(original + 0.6*(original - blur))
  if (sharpen && width > 2 && height > 2) {
    const blurred = new Uint8Array(totalPixels);
    blurred.set(luma.subarray(0, width));
    blurred.set(luma.subarray(totalPixels - width), totalPixels - width);
    for (let y = 1; y < height - 1; y++) {
      const ro = y * width;
      blurred[ro] = luma[ro];
      blurred[ro + width - 1] = luma[ro + width - 1];
      for (let x = 1; x < width - 1; x++) {
        blurred[ro + x] = Math.round(
          (luma[(y - 1) * width + x - 1] + luma[(y - 1) * width + x] + luma[(y - 1) * width + x + 1] +
           luma[ro + x - 1]              + luma[ro + x]               + luma[ro + x + 1] +
           luma[(y + 1) * width + x - 1] + luma[(y + 1) * width + x] + luma[(y + 1) * width + x + 1]) / 9
        );
      }
    }
    for (let p = 0; p < totalPixels; p++) {
      const boosted = luma[p] + 0.6 * (luma[p] - blurred[p]);
      luma[p] = boosted < 0 ? 0 : boosted > 255 ? 255 : Math.round(boosted);
    }
  }

  // Step 4: Projection-Profile Deskew (aligns horizontal Shirorekha within ±15°)
  let detectedSkewAngle = 0;
  const deskew = options.deskew !== false;
  if (deskew) {
    detectedSkewAngle = detectSkewAngle(luma, width, height, 15, 0.5);
  }

  // Step 5: Local adaptive binarization (Sauvola Adaptive Thresholding, PRD Stage 1)
  // Formula: T(x, y) = m(x, y) * [1 + k * (s(x, y) / R - 1)]
  // Uses 2D integral images for O(1) local mean & std-dev
  if (binarize) {
    const k = options.sauvolaK ?? (documentMode === 'handwritten' ? 0.15 : 0.2);
    const R = options.sauvolaR ?? 128;
    const binarized = applySauvolaThreshold(luma, width, height, k, R, 15);
    luma.set(binarized);
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

  // Apply deskew rotation if significant tilt detected (>= 0.5°)
  if (Math.abs(detectedSkewAngle) >= 0.5) {
    const rad = (-detectedSkewAngle * Math.PI) / 180;
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = width;
    rotatedCanvas.height = height;
    const rCtx = rotatedCanvas.getContext('2d');
    if (rCtx) {
      rCtx.translate(width / 2, height / 2);
      rCtx.rotate(rad);
      rCtx.drawImage(canvas, -width / 2, -height / 2);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(rotatedCanvas, 0, 0);
      rotatedCanvas.width = 0;
      rotatedCanvas.height = 0;
    }
  }

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
 * Sauvola Adaptive Thresholding Algorithm (PRD Stage 1)
 * Formula: T(x, y) = m(x, y) * [1 + k * (s(x, y) / R - 1)]
 * Uses 2D integral images (prefix sums of x and x^2) for O(1) local mean & std-dev
 */
export function applySauvolaThreshold(
  luma: Uint8Array,
  width: number,
  height: number,
  k: number = 0.2,
  R: number = 128,
  windowSize: number = 15
): Uint8Array {
  const totalPixels = width * height;
  const binarized = new Uint8Array(totalPixels);
  const half = Math.floor(windowSize / 2);
  const W1 = width + 1;

  // Prefix sums: prefixSum for x, prefixSumSq for x^2
  const prefixSum = new Float64Array((height + 1) * W1);
  const prefixSumSq = new Float64Array((height + 1) * W1);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const val = luma[rowOffset + x];
      const valSq = val * val;
      const idx = (y + 1) * W1 + (x + 1);
      const topIdx = y * W1 + (x + 1);
      const leftIdx = (y + 1) * W1 + x;
      const diagIdx = y * W1 + x;

      prefixSum[idx] = val + prefixSum[topIdx] + prefixSum[leftIdx] - prefixSum[diagIdx];
      prefixSumSq[idx] = valSq + prefixSumSq[topIdx] + prefixSumSq[leftIdx] - prefixSumSq[diagIdx];
    }
  }

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - half);
    const y2 = Math.min(height - 1, y + half);
    const rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(width - 1, x + half);
      const area = (y2 - y1 + 1) * (x2 - x1 + 1);

      const sum =
        prefixSum[(y2 + 1) * W1 + (x2 + 1)] -
        prefixSum[y1 * W1 + (x2 + 1)] -
        prefixSum[(y2 + 1) * W1 + x1] +
        prefixSum[y1 * W1 + x1];

      const sumSq =
        prefixSumSq[(y2 + 1) * W1 + (x2 + 1)] -
        prefixSumSq[y1 * W1 + (x2 + 1)] -
        prefixSumSq[(y2 + 1) * W1 + x1] +
        prefixSumSq[y1 * W1 + x1];

      const mean = sum / area;
      const variance = Math.max(0, sumSq / area - mean * mean);
      const stdDev = Math.sqrt(variance);

      // Sauvola threshold formula
      const threshold = mean * (1 + k * (stdDev / R - 1));

      binarized[rowOffset + x] = luma[rowOffset + x] < threshold ? 0 : 255;
    }
  }

  return binarized;
}

/**
 * Detects horizontal Shirorekha / baseline skew angle within ±maxAngle degrees
 * using the variance of horizontal projection profiles.
 */
export function detectSkewAngle(
  luma: Uint8Array,
  width: number,
  height: number,
  maxAngle: number = 15,
  step: number = 0.5
): number {
  if (width < 30 || height < 30) return 0;

  // Subsample for fast O(1) evaluation (target max ~300 width/height)
  const scale = Math.max(1, Math.floor(Math.max(width, height) / 300));
  const subW = Math.floor(width / scale);
  const subH = Math.floor(height / scale);

  // Inverted sample buffer where dark ink = high value
  const ink = new Uint8Array(subW * subH);
  for (let sy = 0; sy < subH; sy++) {
    const srcY = sy * scale;
    for (let sx = 0; sx < subW; sx++) {
      const srcX = sx * scale;
      const v = luma[srcY * width + srcX];
      ink[sy * subW + sx] = v < 180 ? 255 - v : 0;
    }
  }

  let bestAngle = 0;
  let maxVariance = -1;
  const midX = subW / 2;

  for (let angle = -maxAngle; angle <= maxAngle; angle += step) {
    const rad = (angle * Math.PI) / 180;
    const tan = Math.tan(rad);
    const profile = new Float64Array(subH);

    for (let sy = 0; sy < subH; sy++) {
      let rowSum = 0;
      for (let sx = 0; sx < subW; sx++) {
        const targetY = Math.round(sy + (sx - midX) * tan);
        if (targetY >= 0 && targetY < subH) {
          rowSum += ink[targetY * subW + sx];
        }
      }
      profile[sy] = rowSum;
    }

    let sum = 0;
    let sumSq = 0;
    for (let sy = 0; sy < subH; sy++) {
      const val = profile[sy];
      sum += val;
      sumSq += val * val;
    }
    const mean = sum / subH;
    const variance = sumSq / subH - mean * mean;

    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = angle;
    }
  }

  return bestAngle;
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
