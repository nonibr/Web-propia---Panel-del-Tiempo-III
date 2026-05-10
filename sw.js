// ─── Service Worker — Panel Tracy ───────────────────────
// Versión de caché: cambia este número cada vez que
// actualices el panel para forzar la recarga en el móvil.
const CACHE_NAME = 'panel-tracy-v1';

// Archivos que se guardan en caché para uso offline
const ARCHIVOS_CACHE = [
  './Web propia - Panel del Tiempo IV.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALACIÓN: guarda los archivos en caché ─────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Guardando archivos en caché...');
      return cache.addAll(ARCHIVOS_CACHE);
    })
  );
  self.skipWaiting();
});

// ── ACTIVACIÓN: elimina cachés antiguas ───────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: sirve desde caché si no hay red ────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          }
          return networkResponse;
        }).catch(() => cached);
        return cached;
      }
      return fetch(event.request).catch(() => {
        return caches.match('./Web propia - Panel del Tiempo III.html');
      });
    })
  );
});
