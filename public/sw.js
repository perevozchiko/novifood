/*
  NoviFood Service Worker — offline fallback strategy.

  Strategy:
  - On install: cache the offline page and key app assets.
  - On fetch: try network first; if it fails for a navigation request,
    return the offline page so the user sees a friendly message instead
    of the browser's default error screen.
  - API calls (/api/*) and Supabase requests are not intercepted —
    they fail naturally so the app can show its own error UI.
*/

const CACHE_NAME = 'novifood-v1';
const OFFLINE_PAGE = '/offline';
const PRECACHE = [OFFLINE_PAGE, '/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests and cross-origin requests */
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  /* Skip API routes — let them fail naturally */
  if (url.pathname.startsWith('/api/')) return;

  /* Network-first: try live, cache shell page on success, serve offline on failure */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_PAGE).then((r) => r ?? Response.error())),
    );
    return;
  }

  /* Cache-first for static assets (_next/static, icons, etc.) */
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});
