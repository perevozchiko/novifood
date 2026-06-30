/*
  Generates public/sw.js with a per-build cache name so deployed PWAs can
  detect and apply updates on desktop, iOS, and Android.
*/

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const buildId = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
  } catch {
    return 'dev';
  }
})();

const sw = `/*
  NoviFood Service Worker — generated at build time. Do not edit by hand.
  BUILD_ID: ${buildId}

  Update strategy (prompt):
  - A new build changes this file and installs a waiting worker.
  - The app shows an update prompt; the user applies it via SKIP_WAITING.
  - Foreground checks (focus / visibility) help installed iOS PWAs pick up updates.
*/

const CACHE_NAME = 'novifood-${buildId}';
const OFFLINE_PAGE = '/offline';
const PRECACHE = [OFFLINE_PAGE, '/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

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
`;

writeFileSync(join(root, 'public/sw.js'), sw);
console.log(`Generated public/sw.js (build ${buildId})`);
