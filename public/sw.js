// Rhythm service worker: offline-first shell caching + background sync stub.
// Data itself (habits, check-ins) is cached separately by the app via IndexedDB
// through the Supabase client's own retry queue pattern - this worker focuses
// on making the app *shell* load instantly offline.

const CACHE_NAME = 'rhythm-shell-v1';
const SHELL_URLS = ['/today', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for API/data calls (always want freshness when online);
// cache-first for the app shell so navigation works offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ offline: true }), { status: 503 })));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Push notification handling (see reminders/push_subscriptions in the schema).
// Wire this up once an Edge Function is sending real payloads.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Rhythm', {
      body: payload.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  );
});
