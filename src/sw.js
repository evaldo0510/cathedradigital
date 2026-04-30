import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Workbox precaching (all build assets will be automatically injected here)
precacheAndRoute(self.__WB_MANIFEST);

// Cathedra Service Worker — Push Notifications + Offline Cache
const CACHE_NAME = 'cathedra-v3';
const LITURGY_CACHE = 'cathedra-liturgy-v3';

// ─── Install & Activate ───
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== LITURGY_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Custom Fetch: Liturgy API ───
// We use a custom fetch listener for this because we want to use the request body as part of the cache key
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.includes('/functions/v1/liturgical-calendar')) {
    event.respondWith(networkFirstLiturgy(event.request));
  }
});

async function networkFirstLiturgy(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(LITURGY_CACHE);
      const body = await request.clone().text();
      const cacheKey = request.url + '?body=' + encodeURIComponent(body);
      await cache.put(new Request(cacheKey), response.clone());
    }
    return response;
  } catch (e) {
    const cache = await caches.open(LITURGY_CACHE);
    const body = await request.clone().text();
    const cacheKey = request.url + '?body=' + encodeURIComponent(body);
    const cached = await cache.match(new Request(cacheKey));
    if (cached) return cached;
    
    return new Response(
      JSON.stringify({ error: 'Offline — sem cache disponível para esta data.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── Workbox Routing for other assets ───
// Navigation route (App Shell)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'navigation-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  })
);

// Google Fonts

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// External Images
registerRoute(
  /^https:\/\/images\.unsplash\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'unsplash-images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ─── Push Notifications ───
self.addEventListener('push', (event) => {
  let data = { title: 'Cathedra', body: 'Nova mensagem', url: '/dashboard' };
  try {
    data = event.data.json();
  } catch (e) {
    // fallback
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/favicon.svg',
    data: { url: data.url || '/dashboard' },
    vibrate: [100, 50, 100],
    actions: [{ action: 'open', title: 'Abrir' }],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Cathedra', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
