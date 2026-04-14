/* ==========================================================================
   Adiós BG — CV Utilities
   Computer Vision functions for classification and watermark detection.
   Runs inside a Web Worker — no DOM access.
   ========================================================================== */

/**
 * Classify an image as photo, icon, or signature.
 * Uses color analysis and edge detection heuristics.
 * @param {ImageData} imageData
 * @returns {{ type: 'photo'|'icon'|'signature', confidence: number }}
 */
export function classifyImage(imageData) {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  // 1. Count unique colors (sampled)
  const colorSet = new Set();
  const step = Math.max(1, Math.floor(totalPixels / 10000)); // Sample ~10k pixels
  for (let i = 0; i < data.length; i += step * 4) {
    // Quantize to reduce noise (group into 32-level buckets)
    const r = (data[i] >> 3) << 3;
    const g = (data[i + 1] >> 3) << 3;
    const b = (data[i + 2] >> 3) << 3;
    colorSet.add(`${r},${g},${b}`);
  }
  const uniqueColors = colorSet.size;

  // 2. Analyze transparency
  let transparentPixels = 0;
  let nearWhitePixels = 0;
  let nearBlackPixels = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const a = data[i + 3];
    if (a < 128) transparentPixels++;
    
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 240 && g > 240 && b > 240) nearWhitePixels++;
    if (r < 30 && g < 30 && b < 30) nearBlackPixels++;
  }

  const sampledPixels = Math.ceil(totalPixels / step);
  const transparencyRatio = transparentPixels / sampledPixels;
  const whiteRatio = nearWhitePixels / sampledPixels;
  const blackRatio = nearBlackPixels / sampledPixels;

  // 3. Check if signature: mostly white/transparent with thin dark strokes
  if ((whiteRatio > 0.7 || transparencyRatio > 0.5) && 
      uniqueColors < 100 && 
      blackRatio > 0.01 && blackRatio < 0.3) {
    return { type: 'signature', confidence: 0.8 };
  }

  // 4. Check if icon: few colors, likely has transparency
  if (uniqueColors < 200 && (transparencyRatio > 0.1 || totalPixels < 512 * 512)) {
    return { type: 'icon', confidence: 0.75 };
  }

  // 5. Default: photo
  return { type: 'photo', confidence: 0.9 };
}

/**
 * Detect potential AI watermarks in image corners.
 * Looks for Gemini sparkles (bright clusters) and DALL-E color bars.
 * @param {ImageData} imageData
 * @returns {{ found: boolean, regions: Array<{x,y,w,h}>, mask: Uint8Array|null }}
 */
export function detectWatermark(imageData) {
  const { data, width, height } = imageData;
  const cornerSize = Math.floor(Math.min(width, height) * 0.12);
  const regions = [];

  // Check each corner
  const corners = [
    { x: 0, y: 0 },                                         // top-left
    { x: width - cornerSize, y: 0 },                        // top-right
    { x: 0, y: height - cornerSize },                       // bottom-left
    { x: width - cornerSize, y: height - cornerSize },       // bottom-right
  ];

  for (const corner of corners) {
    const analysis = analyzeCorner(data, width, height, corner.x, corner.y, cornerSize);
    if (analysis.isWatermark) {
      regions.push({
        x: corner.x,
        y: corner.y,
        w: cornerSize,
        h: cornerSize,
        type: analysis.type,
      });
    }
  }

  // Also check bottom strip for DALL-E style bars
  const bottomStripH = Math.floor(height * 0.04);
  if (bottomStripH > 4) {
    const barAnalysis = analyzeColorBar(data, width, height, 0, height - bottomStripH, width, bottomStripH);
    if (barAnalysis.isBar) {
      regions.push({
        x: 0,
        y: height - bottomStripH,
        w: width,
        h: bottomStripH,
        type: 'color-bar',
      });
    }
  }

  if (regions.length === 0) {
    return { found: false, regions: [], mask: null };
  }

  // Generate binary mask
  const mask = new Uint8Array(width * height);
  for (const r of regions) {
    for (let y = r.y; y < r.y + r.h && y < height; y++) {
      for (let x = r.x; x < r.x + r.w && x < width; x++) {
        mask[y * width + x] = 255;
      }
    }
  }

  return { found: true, regions, mask };
}

/**
 * Analyze a corner region for watermark indicators
 */
function analyzeCorner(data, width, height, cx, cy, size) {
  let brightPixels = 0;
  let totalSampled = 0;
  let colorVariance = 0;
  const brightnesses = [];

  for (let y = cy; y < cy + size && y < height; y++) {
    for (let x = cx; x < cx + size && x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      brightnesses.push(brightness);
      
      if (brightness > 220) brightPixels++;
      totalSampled++;
    }
  }

  // Gemini sparkles: sudden bright spots in a cluster
  const brightRatio = brightPixels / totalSampled;
  
  // Calculate variance — sparkles have high local variance
  if (brightnesses.length > 0) {
    const mean = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
    colorVariance = brightnesses.reduce((sum, b) => sum + (b - mean) ** 2, 0) / brightnesses.length;
  }

  // High bright-to-dark contrast in a small area suggests watermark
  const isWatermark = brightRatio > 0.15 && brightRatio < 0.6 && colorVariance > 2000;
  
  return {
    isWatermark,
    type: 'sparkle',
    brightRatio,
    variance: colorVariance,
  };
}

/**
 * Analyze a horizontal strip for solid-color bars (DALL-E style)
 */
function analyzeColorBar(data, width, height, rx, ry, rw, rh) {
  const colors = [];
  const step = Math.max(1, Math.floor(rw / 200));

  for (let x = rx; x < rx + rw; x += step) {
    const y = ry + Math.floor(rh / 2);
    const idx = (y * width + x) * 4;
    colors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }

  // Check if there are distinct solid-color segments
  let transitions = 0;
  for (let i = 1; i < colors.length; i++) {
    const dr = Math.abs(colors[i].r - colors[i - 1].r);
    const dg = Math.abs(colors[i].g - colors[i - 1].g);
    const db = Math.abs(colors[i].b - colors[i - 1].b);
    if (dr + dg + db > 80) transitions++;
  }

  // DALL-E bars: few sharp transitions with solid color between
  const transitionRatio = transitions / colors.length;
  return { isBar: transitionRatio > 0.01 && transitionRatio < 0.08 && colors.length > 20 };
}

/**
 * Simple inpainting using weighted average of surrounding pixels.
 * This is a lightweight JS fallback; for production, OpenCV.js Telea is preferred.
 * @param {ImageData} imageData - Source image (will be modified in place)
 * @param {Uint8Array} mask - Binary mask (255 = area to inpaint)
 * @param {number} radius - Inpainting radius in pixels
 * @returns {ImageData}
 */
export function inpaintSimple(imageData, mask, radius = 5) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] !== 255) continue;
      
      // Weighted average of surrounding non-masked pixels
      let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (mask[ny * width + nx] === 255) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radius) continue;
          const w = 1 / (dist + 0.5);

          const nIdx = (ny * width + nx) * 4;
          sumR += data[nIdx] * w;
          sumG += data[nIdx + 1] * w;
          sumB += data[nIdx + 2] * w;
          sumW += w;
        }
      }

      if (sumW > 0) {
        const idx = (y * width + x) * 4;
        result[idx] = sumR / sumW;
        result[idx + 1] = sumG / sumW;
        result[idx + 2] = sumB / sumW;
        result[idx + 3] = 255;
      }
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Process icon/signature: simple threshold-based background removal.
 * Much faster than ML model for simple graphics.
 * @param {ImageData} imageData
 * @param {string} type - 'icon' or 'signature'
 * @returns {ImageData}
 */
export function removeSimpleBackground(imageData, type) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);

  if (type === 'signature') {
    // For signatures: keep dark strokes, remove white/light background
    for (let i = 0; i < result.length; i += 4) {
      const r = result[i], g = result[i + 1], b = result[i + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      
      if (brightness > 200) {
        // Background → transparent
        result[i + 3] = 0;
      } else if (brightness > 150) {
        // Transition zone → partial transparency for anti-aliasing
        result[i + 3] = Math.round(255 * (1 - (brightness - 150) / 50));
      }
      // else: keep as-is (foreground)
    }
  } else {
    // For icons: detect dominant background color and remove it
    const bgColor = detectDominantCornerColor(data, width, height);
    const threshold = 45;

    for (let i = 0; i < result.length; i += 4) {
      const dr = Math.abs(result[i] - bgColor.r);
      const dg = Math.abs(result[i + 1] - bgColor.g);
      const db = Math.abs(result[i + 2] - bgColor.b);
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < threshold) {
        result[i + 3] = 0;
      } else if (dist < threshold * 1.5) {
        // Smooth transition
        const alpha = (dist - threshold) / (threshold * 0.5);
        result[i + 3] = Math.round(255 * Math.min(1, alpha));
      }
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Detect dominant color from image corners (likely background)
 */
function detectDominantCornerColor(data, width, height) {
  const sampleSize = Math.min(20, Math.floor(Math.min(width, height) * 0.1));
  let sumR = 0, sumG = 0, sumB = 0, count = 0;

  // Sample from all four corners
  const corners = [
    [0, 0], [width - sampleSize, 0],
    [0, height - sampleSize], [width - sampleSize, height - sampleSize],
  ];

  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + sampleSize && y < height; y++) {
      for (let x = cx; x < cx + sampleSize && x < width; x++) {
        const idx = (y * width + x) * 4;
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        count++;
      }
    }
  }

  return {
    r: Math.round(sumR / count),
    g: Math.round(sumG / count),
    b: Math.round(sumB / count),
  };
}
