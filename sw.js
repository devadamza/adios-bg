/* ==========================================================================
   Adiós BG — Service Worker
   Cache-first strategy for offline PWA support.
   Caches: static assets, Google Fonts, ML model files.
   ========================================================================== */

const CACHE_NAME = 'adiosbg-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/design-tokens.css',
  './css/index.css',
  './css/components.css',
  './js/app.js',
  './js/state.js',
  './js/components/ar-dropzone.js',
  './js/components/ar-editor.js',
  './js/components/ar-toolbar.js',
  './js/components/ar-progress.js',
  './js/components/ar-toast.js',
  './manifest.json',
];

// CDN patterns to cache at runtime (model files, Transformers.js, etc.)
const CDN_CACHE_PATTERNS = [
  'cdn.jsdelivr.net',
  'huggingface.co',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Strategy for CDN assets (model files, fonts): Cache-First
  if (CDN_CACHE_PATTERNS.some(pattern => url.hostname.includes(pattern))) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Strategy for local assets: Cache-First with network fallback
  event.respondWith(cacheFirst(event.request));
});

/**
 * Cache-First strategy:
 * 1. Check cache
 * 2. If miss, fetch from network and cache the response
 * 3. If both fail, return offline fallback
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Don't await — cache in background
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (err) {
    // If it's a navigation request, return cached index.html
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    
    // Otherwise return a simple offline response
    return new Response('Offline — no se encontró la versión en caché', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
