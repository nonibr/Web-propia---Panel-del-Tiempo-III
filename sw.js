// ─── Service Worker — Panel Tracy ───────────────────────
const CACHE_NAME = 'panel-tracy-v14';
const ARCHIVO_PANEL = './Web propia - Panel del Tiempo XII.html';

// Solo cachear el propio HTML del panel
const ARCHIVOS_CACHE = [
  ARCHIVO_PANEL
];

// INSTALACIÓN
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ARCHIVOS_CACHE).catch(e => {
        console.warn('[SW] No se pudo cachear:', e);
      });
    })
  );
  self.skipWaiting();
});

// ACTIVACIÓN: eliminar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH: solo interceptar peticiones al propio origen (nonibr.github.io)
// Dejar pasar SIN interceptar: Firebase, gstatic.com, googleapis.com, etc.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo interceptar peticiones al mismo origen
  if (url.origin !== self.location.origin) {
    // Petición externa (Firebase, CDN, etc.) — dejar pasar directamente
    return;
  }

  // Petición interna: strategy "cache first, network fallback"
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Actualizar en segundo plano
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, response.clone())
            );
          }
        }).catch(() => {});
        return cached;
      }
      // No está en caché: ir a la red
      return fetch(event.request).catch(() => {
        return caches.match(ARCHIVO_PANEL);
      });
    })
  );
});
