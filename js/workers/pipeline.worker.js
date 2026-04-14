/* ==========================================================================
   Adiós BG — Pipeline Worker
   Orchestrates the full background-removal pipeline:
     1. Classification (CV)
     2. Watermark detection (CV)
     3. Segmentation (ML — RMBG-1.4 via Transformers.js)
     4. Alpha refinement (CV)
   ========================================================================== */

import { classifyImage, detectWatermark, inpaintSimple, removeSimpleBackground } from './cv-utils.js';
import { refineMask, applyAlphaMask } from './refinement.js';

// ── State ───────────────────────────────────────────────────────────────────
let segmenter = null;
let isModelLoading = false;

// ── Message handler ─────────────────────────────────────────────────────────
self.onmessage = async function (e) {
  const { type, imageData, width, height, id } = e.data;

  switch (type) {
    case 'init':
      await initModel();
      break;

    case 'process':
      await processImage(imageData, width, height, id);
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

// ── Model initialization ────────────────────────────────────────────────────
async function initModel() {
  if (segmenter || isModelLoading) return;
  isModelLoading = true;

  notify('status', { stage: 'loading-model', messageKey: 'worker.loadingModel' });

  try {
    // Dynamic import of Transformers.js
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3');
    
    // Configure: prefer local cache, disable remote models check
    env.allowLocalModels = false;
    
    segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
      device: 'webgpu',       // Try WebGPU first
      dtype: 'fp32',
    }).catch(async () => {
      // Fallback to WASM if WebGPU unavailable
      console.log('[Worker] WebGPU not available, falling back to WASM');
      return pipeline('image-segmentation', 'briaai/RMBG-1.4', {
        device: 'wasm',
        dtype: 'q8',          // Use quantized model for WASM
      });
    });

    notify('status', { stage: 'model-ready', messageKey: 'worker.modelReady' });
    isModelLoading = false;
  } catch (err) {
    isModelLoading = false;
    notify('error', { message: `Error cargando modelo: ${err.message}` });
    throw err;
  }
}

// ── Main processing pipeline ────────────────────────────────────────────────
async function processImage(imageData, width, height, id) {
  const startTime = performance.now();

  try {
    // ── Stage 0: Reconstruct ImageData ──────────────────────────────────
    let imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);

    // ── Stage 1: Classification ─────────────────────────────────────────
    notify('progress', { stageIndex: 0, progress: 5, messageKey: 'worker.analyzing' });
    
    const classification = classifyImage(imgData);
    notify('progress', { 
      stageIndex: 0, progress: 15, 
      messageKey: 'worker.detected',
      messageVal: classification.type,
      imageType: classification.type
    });

    // ── Stage 2: Watermark detection ────────────────────────────────────
    notify('progress', { stageIndex: 1, progress: 20, messageKey: 'worker.searchingWatermarks' });
    
    const watermark = detectWatermark(imgData);
    
    if (watermark.found) {
      notify('progress', { 
        stageIndex: 1, progress: 25, 
        messageKey: 'worker.repairingWatermark',
        watermarkDetected: true
      });
      // Inpaint the watermark region
      imgData = inpaintSimple(imgData, watermark.mask, 7);
    }

    notify('progress', { stageIndex: 1, progress: 30, messageKey: 'worker.watermarksOk' });

    // ── Stage 3: Segmentation ───────────────────────────────────────────
    if (classification.type === 'icon' || classification.type === 'signature') {
      // Fast path: threshold-based removal for simple graphics
      notify('progress', { stageIndex: 2, progress: 50, messageKey: 'worker.fastMode' });
      
      imgData = removeSimpleBackground(imgData, classification.type);
      
      notify('progress', { stageIndex: 2, progress: 75, messageKey: 'worker.bgRemoved' });
    } else {
      // ML path: use RMBG-1.4 for photos
      notify('progress', { stageIndex: 2, progress: 35, messageKey: 'worker.initMl' });

      // Ensure model is loaded
      if (!segmenter) {
        await initModel();
      }

      notify('progress', { stageIndex: 2, progress: 40, messageKey: 'worker.processingAi' });

      // Create a blob from imageData to pass to the pipeline
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imgData, 0, 0);
      const blob = await canvas.convertToBlob({ type: 'image/png' });

      // Run segmentation
      const results = await segmenter(blob, {
        threshold: 0.5,
        mask_threshold: 0.5,
      });

      notify('progress', { stageIndex: 2, progress: 70, messageKey: 'worker.segComplete' });

      // Extract mask from results
      // Transformers.js returns array of { label, score, mask (RawImage) }
      if (results && results.length > 0) {
        const maskResult = results[0];
        const maskRaw = maskResult.mask; // RawImage object

        // RawImage has .width, .height, .channels, .data (Uint8ClampedArray)
        // Resize the mask to match original image dimensions
        const { RawImage } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3');
        const resizedMask = await maskRaw.resize(width, height);
        
        // Extract single-channel alpha from the mask data
        // RawImage.data is [R,G,B,A,...] if 4 channels, or [L,...] if 1 channel
        const maskPixels = resizedMask.data;
        const channels = resizedMask.channels;
        const alphaMask = new Uint8ClampedArray(width * height);

        if (channels === 1) {
          // Grayscale mask: each pixel is a single value 0-255
          for (let i = 0; i < width * height; i++) {
            alphaMask[i] = maskPixels[i];
          }
        } else {
          // RGBA mask: use red channel as alpha
          for (let i = 0; i < width * height; i++) {
            alphaMask[i] = maskPixels[i * channels];
          }
        }

        // ── Stage 4: Refinement ───────────────────────────────────────
        notify('progress', { stageIndex: 3, progress: 80, messageKey: 'worker.refining' });

        const refinedMask = refineMask(alphaMask, width, height, {
          featherRadius: 2,
          erodeRadius: 1,
        });

        notify('progress', { stageIndex: 3, progress: 90, messageKey: 'worker.applyingMask' });

        imgData = applyAlphaMask(imgData, refinedMask, { defringe: true });
      }
    }

    // ── Final: Send result ──────────────────────────────────────────────
    const elapsed = performance.now() - startTime;
    
    notify('progress', { stageIndex: 3, progress: 95, messageKey: 'worker.generatingResult' });

    // Convert final ImageData to PNG blob via OffscreenCanvas
    const outCanvas = new OffscreenCanvas(width, height);
    const outCtx = outCanvas.getContext('2d');
    outCtx.putImageData(imgData, 0, 0);
    const resultBlob = await outCanvas.convertToBlob({ type: 'image/png' });

    notify('complete', {
      id,
      blob: resultBlob,
      processingTime: elapsed,
      imageType: classification.type,
      watermarkDetected: watermark.found,
    });

  } catch (err) {
    console.error('[Worker] Processing failed:', err);
    notify('error', { 
      id, 
      message: `Error procesando: ${err.message}`,
      messageKey: 'toast.errInternal'
    });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function notify(type, data) {
  self.postMessage({ type, ...data });
}
