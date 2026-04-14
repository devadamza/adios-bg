/* ==========================================================================
   Adiós BG — Alpha Matting / Edge Refinement
   Pure JS implementation for feathering and defringing.
   Runs inside a Web Worker.
   ========================================================================== */

/**
 * Refine a segmentation mask with feathering and morphological operations.
 * @param {Uint8ClampedArray|Uint8Array} mask - Grayscale mask (0 = bg, 255 = fg)
 * @param {number} width
 * @param {number} height
 * @param {object} options
 * @param {number} [options.featherRadius=2] - Gaussian blur radius for soft edges
 * @param {number} [options.erodeRadius=1] - Erosion to remove halos
 * @param {boolean} [options.defringe=true] - Remove color fringe on edges
 * @returns {Uint8ClampedArray} - Refined alpha channel
 */
export function refineMask(mask, width, height, options = {}) {
  const {
    featherRadius = 2,
    erodeRadius = 1,
    defringe = true,
  } = options;

  let refined = new Uint8ClampedArray(mask);

  // Step 1: Slight erosion to pull mask edges inward (removes halos)
  if (erodeRadius > 0) {
    refined = morphErode(refined, width, height, erodeRadius);
  }

  // Step 2: Gaussian blur for feathered edges
  if (featherRadius > 0) {
    refined = gaussianBlur(refined, width, height, featherRadius);
  }

  return refined;
}

/**
 * Apply refined alpha mask to image data.
 * Also handles defringing by interpolating edge pixel colors.
 * @param {ImageData} imageData - Original image
 * @param {Uint8ClampedArray} alphaMask - Refined alpha values
 * @param {object} options
 * @param {boolean} [options.defringe=true] - Clean edge colors
 * @returns {ImageData} - Image with alpha channel applied
 */
export function applyAlphaMask(imageData, alphaMask, options = {}) {
  const { defringe = true } = options;
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);

  for (let i = 0; i < width * height; i++) {
    const alpha = alphaMask[i];
    const pixIdx = i * 4;
    
    if (alpha === 0) {
      // Fully transparent
      result[pixIdx] = 0;
      result[pixIdx + 1] = 0;
      result[pixIdx + 2] = 0;
      result[pixIdx + 3] = 0;
    } else if (alpha < 255 && defringe) {
      // Edge pixel: apply alpha and defringe
      // Defringe: lerp towards nearest fully-opaque foreground pixel color
      const fgColor = findNearestForeground(data, alphaMask, width, height, i % width, Math.floor(i / width), 3);
      
      if (fgColor) {
        const t = alpha / 255;
        result[pixIdx]     = Math.round(fgColor.r * t);
        result[pixIdx + 1] = Math.round(fgColor.g * t);
        result[pixIdx + 2] = Math.round(fgColor.b * t);
      } else {
        // Premultiply alpha
        const t = alpha / 255;
        result[pixIdx]     = Math.round(result[pixIdx] * t);
        result[pixIdx + 1] = Math.round(result[pixIdx + 1] * t);
        result[pixIdx + 2] = Math.round(result[pixIdx + 2] * t);
      }
      result[pixIdx + 3] = alpha;
    } else {
      // Fully opaque — keep original
      result[pixIdx + 3] = alpha;
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Find nearest fully-opaque foreground pixel for defringing
 */
function findNearestForeground(data, mask, width, height, x, y, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      
      const ni = ny * width + nx;
      if (mask[ni] >= 240) {
        const idx = ni * 4;
        return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
      }
    }
  }
  return null;
}

/**
 * Morphological erosion on a grayscale mask
 * @param {Uint8ClampedArray} mask
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @returns {Uint8ClampedArray}
 */
function morphErode(mask, width, height, radius) {
  const result = new Uint8ClampedArray(mask.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // Circular kernel
          if (dx * dx + dy * dy > radius * radius) continue;

          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            minVal = Math.min(minVal, mask[ny * width + nx]);
          }
        }
      }

      result[y * width + x] = minVal;
    }
  }

  return result;
}

/**
 * Gaussian blur on a single-channel grayscale buffer.
 * Uses separable kernel for performance.
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @returns {Uint8ClampedArray}
 */
function gaussianBlur(data, width, height, radius) {
  const kernel = createGaussianKernel(radius);
  const kLen = kernel.length;
  const kHalf = Math.floor(kLen / 2);

  // Horizontal pass
  const temp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, wSum = 0;
      for (let k = 0; k < kLen; k++) {
        const sx = x + k - kHalf;
        if (sx >= 0 && sx < width) {
          sum += data[y * width + sx] * kernel[k];
          wSum += kernel[k];
        }
      }
      temp[y * width + x] = sum / wSum;
    }
  }

  // Vertical pass
  const result = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, wSum = 0;
      for (let k = 0; k < kLen; k++) {
        const sy = y + k - kHalf;
        if (sy >= 0 && sy < height) {
          sum += temp[sy * width + x] * kernel[k];
          wSum += kernel[k];
        }
      }
      result[y * width + x] = Math.round(sum / wSum);
    }
  }

  return result;
}

/**
 * Create 1D Gaussian kernel
 * @param {number} radius
 * @returns {Float32Array}
 */
function createGaussianKernel(radius) {
  const sigma = radius / 2;
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }

  // Normalize
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}
