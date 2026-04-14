/* ==========================================================================
   Adiós BG — App Bootstrap & Orchestration
   Connects Web Components, Worker, and State
   ========================================================================== */

import { store } from './state.js';

// ── Import Web Components (self-registering) ────────────────────────────────
import './components/ar-dropzone.js';
import './components/ar-editor.js';
import './components/ar-toolbar.js';
import './components/ar-progress.js';
import './components/ar-toast.js';

// ── DOM References ──────────────────────────────────────────────────────────
const dropzone  = document.getElementById('dropzone');
const progress  = document.getElementById('progress');
const editor    = document.getElementById('editor');
const toolbar   = document.getElementById('toolbar');
const toast     = document.getElementById('toast');

// ── Worker ──────────────────────────────────────────────────────────────────
let worker = null;

function createWorker() {
  worker = new Worker(
    new URL('./workers/pipeline.worker.js', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = handleWorkerMessage;
  worker.onerror = (err) => {
    console.error('[App] Worker error:', err);
    toast.show({ type: 'error', message: 'Error interno del procesador' });
    store.set({ status: 'error', errorMessage: err.message });
  };

  // Start loading model right away (it will be cached for next time)
  worker.postMessage({ type: 'init' });
}

// ── Worker message handler ──────────────────────────────────────────────────
function handleWorkerMessage(e) {
  const msg = e.data;

  switch (msg.type) {
    case 'status':
      if (msg.stage === 'loading-model') {
        store.set({ status: 'loading-model', currentStage: msg.message });
      } else if (msg.stage === 'model-ready') {
        store.set({ modelLoaded: true });
        toast.show({ type: 'success', message: 'Modelo de IA cargado y listo', duration: 3000 });
      }
      break;

    case 'progress':
      store.set({
        status: 'processing',
        stageIndex: msg.stageIndex,
        progress: msg.progress,
        currentStage: msg.message,
      });
      if (msg.imageType) store.set({ imageType: msg.imageType });
      if (msg.watermarkDetected) store.set({ watermarkDetected: true });

      progress.update(msg.stageIndex, msg.progress, msg.message);
      break;

    case 'complete':
      handleComplete(msg);
      break;

    case 'error':
      store.set({ status: 'error', errorMessage: msg.message });
      progress.reset();
      toast.show({ type: 'error', message: msg.message, duration: 6000 });
      break;
  }
}

// ── Handle completed processing ─────────────────────────────────────────────
async function handleComplete(msg) {
  const { blob, processingTime, imageType, watermarkDetected } = msg;

  // Create URL for the result
  const resultUrl = URL.createObjectURL(blob);

  store.set({
    status: 'done',
    resultBlob: blob,
    resultDataUrl: resultUrl,
    processingTime,
    imageType,
    watermarkDetected: watermarkDetected || false,
    progress: 100,
    stageIndex: 3,
  });

  // Update progress
  progress.complete(processingTime);

  // Show editor with result
  await editor.setResult(resultUrl);

  // Show toolbar
  toolbar.setResult(editor.getResultCanvas(), {
    processingTime,
    imageType,
  });

  // Success toast
  toast.show({
    type: 'success',
    message: `¡Fondo eliminado en ${(processingTime / 1000).toFixed(1)}s!`,
    duration: 4000,
  });
}

// ── Event listeners ─────────────────────────────────────────────────────────

// Image selected from dropzone
document.addEventListener('image-selected', async (e) => {
  const { file, dataUrl } = e.detail;

  store.set({
    status: 'processing',
    originalFile: file,
    originalDataUrl: dataUrl,
    progress: 0,
    stageIndex: -1,
  });

  // Reset previous results
  editor.reset();
  toolbar.reset();

  // Set original in editor for comparison later
  await editor.setOriginal(dataUrl);

  // Show progress
  progress.start();

  // Decode image to get pixel data
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Send to worker — transfer the buffer for zero-copy
  worker.postMessage(
    {
      type: 'process',
      imageData: imageData.data.buffer,
      width: canvas.width,
      height: canvas.height,
      id: Date.now(),
    },
    [imageData.data.buffer]
  );
});

// Dropzone error
document.addEventListener('dropzone-error', (e) => {
  toast.show({ type: 'error', message: e.detail.message });
});

// New image
document.addEventListener('new-image', () => {
  store.reset();
  dropzone.reset();
  editor.reset();
  toolbar.reset();
  progress.reset();
});

// Toast events from components
document.addEventListener('toast', (e) => {
  toast.show(e.detail);
});

// ── Initialize ──────────────────────────────────────────────────────────────
function init() {
  createWorker();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('[App] Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('[App] Service Worker registration failed:', err);
    });
  }

  console.log('%c🎨 Adiós BG', 'font-size: 20px; font-weight: bold; color: #9b59b6;');
  console.log('%c100% client-side · Zero uploads · Tu privacidad importa', 'color: #7f8c8d;');
}

init();
