
const CACHE_PREFIX = 'cove-';
const CACHE_VERSION = 'cove-v3';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith(CACHE_PREFIX) &&
              key !== CACHE_VERSION
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      .then(async () => {
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        clients.forEach(client => {
          client.postMessage({ type: 'COVE_UPDATED' });
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Never cache API requests.
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for application navigation and shell files.
  if (
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.ok) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(request, response.clone());
          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match('/index.html')
          );
        })
    );

    return;
  }

  // Cache-first for Vite's hashed production assets.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(async cached => {
        if (cached) return cached;

        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          return new Response(
            'This resource is unavailable offline.',
            {
              status: 503,
              headers: {
                'Content-Type': 'text/plain'
              }
            }
          );
        }
      })
    );
  }
});
