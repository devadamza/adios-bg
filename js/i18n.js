/* ==========================================================================
   Adiós BG — i18n
   Translation Dictionary and Utilities
   ========================================================================== */

import { store } from './state.js';

export const translations = {
  es: {
    // Header & HTML Elements
    'header.title': 'Adiós BG',
    'header.subtitle': 'Elimina fondos de imágenes con IA, directo en tu navegador. Sin uploads, 100% privado.',
    'footer.privacy': '100% Privado',
    'footer.offline': 'Funciona Offline',
    'footer.poweredBy': 'Procesado con <a href="https://huggingface.co/briaai/RMBG-1.4" target="_blank" rel="noopener">RMBG-1.4</a> · Todo se ejecuta en tu dispositivo',

    // Dropzone
    'dropzone.title': 'Suelta tu imagen aquí',
    'dropzone.subtitle': 'o haz clic para seleccionar un archivo',
    'dropzone.formats': 'PNG, JPG, WebP, SVG, BMP · Máx {x}MB',
    'dropzone.btnBrowse': 'Seleccionar archivo',
    'dropzone.pasteHint': 'También puedes pegar con',
    'dropzone.btnChange': 'Cambiar imagen',
    'dropzone.err.format': 'Formato no soportado: {x}',
    'dropzone.err.size': 'El archivo excede el límite de {x}MB',

    // Progress
    'progress.stage1': 'Clasificar',
    'progress.stage2': 'Watermarks',
    'progress.stage3': 'Segmentar',
    'progress.stage4': 'Refinar',
    'progress.processing': 'Procesando...',
    'progress.done': '¡Completado!',

    // Pipeline Messages
    'worker.loadingModel': 'Cargando modelo de IA...',
    'worker.modelReady': 'Modelo cargado',
    'worker.analyzing': 'Analizando imagen...',
    'worker.detected': 'Detectado: {x}',
    'worker.searchingWatermarks': 'Buscando marcas de agua...',
    'worker.repairingWatermark': 'Marca de agua detectada, reparando...',
    'worker.watermarksOk': 'Watermarks check: OK',
    'worker.fastMode': 'Eliminando fondo (modo rápido)...',
    'worker.bgRemoved': 'Fondo eliminado',
    'worker.initMl': 'Iniciando segmentación ML...',
    'worker.processingAi': 'Procesando con IA...',
    'worker.segComplete': 'Segmentación completada',
    'worker.refining': 'Refinando bordes...',
    'worker.applyingMask': 'Aplicando máscara...',
    'worker.generatingResult': 'Generando resultado...',
    
    // Editor
    'editor.original': 'Original',
    'editor.result': 'Resultado',
    'editor.compare': 'Comparar',

    // Toolbar
    'toolbar.downloadPng': 'Descargar PNG',
    'toolbar.downloadBg': 'Con fondo',
    'toolbar.copy': 'Copiar',
    'toolbar.new': 'Nueva',
    'toolbar.statTime': 'Procesado en <span class="stat__value">{x}s</span>',
    'toolbar.statType': 'Tipo: <span class="stat__value" style="text-transform: capitalize;">{x}</span>',

    // Toasts & Errors
    'toast.successDone': '¡Fondo eliminado en {x}s!',
    'toast.copied': '¡Copiado!',
    'toast.errCopy': 'No se pudo copiar al portapapeles',
    'toast.errInternal': 'Error interno del procesador',
    'toast.modelReady': 'Modelo de IA cargado y listo',
  },
  en: {
    // Header & HTML Elements
    'header.title': 'Adiós BG',
    'header.subtitle': 'Remove image backgrounds using AI, straight in your browser. Zero uploads, 100% private.',
    'footer.privacy': '100% Private',
    'footer.offline': 'Works Offline',
    'footer.poweredBy': 'Powered by <a href="https://huggingface.co/briaai/RMBG-1.4" target="_blank" rel="noopener">RMBG-1.4</a> · Everything runs on your device',

    // Dropzone
    'dropzone.title': 'Drop your image here',
    'dropzone.subtitle': 'or click to browse a file',
    'dropzone.formats': 'PNG, JPG, WebP, SVG, BMP · Max {x}MB',
    'dropzone.btnBrowse': 'Select file',
    'dropzone.pasteHint': 'You can also paste using',
    'dropzone.btnChange': 'Change image',
    'dropzone.err.format': 'Unsupported format: {x}',
    'dropzone.err.size': 'File exceeds the {x}MB limit',

    // Progress
    'progress.stage1': 'Classify',
    'progress.stage2': 'Watermarks',
    'progress.stage3': 'Segment',
    'progress.stage4': 'Refine',
    'progress.processing': 'Processing...',
    'progress.done': 'Completed!',

    // Pipeline Messages
    'worker.loadingModel': 'Loading AI model...',
    'worker.modelReady': 'Model loaded',
    'worker.analyzing': 'Analyzing image...',
    'worker.detected': 'Detected: {x}',
    'worker.searchingWatermarks': 'Scanning for watermarks...',
    'worker.repairingWatermark': 'Watermark detected, repairing...',
    'worker.watermarksOk': 'Watermarks check: OK',
    'worker.fastMode': 'Removing background (fast mode)...',
    'worker.bgRemoved': 'Background removed',
    'worker.initMl': 'Initializing ML segmentation...',
    'worker.processingAi': 'Processing with AI...',
    'worker.segComplete': 'Segmentation complete',
    'worker.refining': 'Refining edges...',
    'worker.applyingMask': 'Applying mask...',
    'worker.generatingResult': 'Generating result...',
    
    // Editor
    'editor.original': 'Original',
    'editor.result': 'Result',
    'editor.compare': 'Compare',

    // Toolbar
    'toolbar.downloadPng': 'Download PNG',
    'toolbar.downloadBg': 'With background',
    'toolbar.copy': 'Copy',
    'toolbar.new': 'New',
    'toolbar.statTime': 'Processed in <span class="stat__value">{x}s</span>',
    'toolbar.statType': 'Type: <span class="stat__value" style="text-transform: capitalize;">{x}</span>',

    // Toasts & Errors
    'toast.successDone': 'Background removed in {x}s!',
    'toast.copied': 'Copied!',
    'toast.errCopy': 'Could not copy to clipboard',
    'toast.errInternal': 'Internal processor error',
    'toast.modelReady': 'AI Model loaded and ready',
  }
};

/**
 * Gets a translated string for the provided key based on active language.
 * Replaces '{x}' placeholder if `val` is provided.
 */
export function t(key, val = '') {
  const lang = store.state.language || 'es';
  const dictionary = translations[lang] || translations['en'];
  
  let text = dictionary[key] || translations['en'][key] || key;
  if (val !== undefined && val !== '') {
    text = text.replace('{x}', val);
  }
  return text;
}
