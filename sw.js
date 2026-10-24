// ─── Service Worker — Panel Tracy ───────────────────────
const CACHE_NAME = 'panel-tracy-v15';
const ARCHIVO_PANEL = './Web propia - Panel del Tiempo XV.html';

const ARCHIVOS_CACHE = [ARCHIVO_PANEL];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ARCHIVOS_CACHE).catch(e => console.warn('[SW] No se pudo cachear:', e))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FETCH: solo el propio origen. Firebase, gstatic, etc. pasan sin interceptar.
// Estrategia "red primero": con conexión se carga SIEMPRE la versión más reciente del panel;
// la caché solo se usa si no hay red (así nunca se arranca con una versión vieja).
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' }).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then(cached => cached || caches.match(ARCHIVO_PANEL))
    )
  );
});
