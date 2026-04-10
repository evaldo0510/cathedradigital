import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Workbox precaching (all build assets will be automatically injected here)
precacheAndRoute(self.__WB_MANIFEST);

// Cathedra Service Worker — Push Notifications + Offline Cache
const CACHE_NAME = 'cathedra-v2';
const LITURGY_CACHE = 'cathedra-liturgy-v2';

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

// ─── Fetch: network-first for liturgy API, cache fallback ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept liturgical-calendar API calls
  if (url.pathname.includes('/functions/v1/liturgical-calendar')) {
    event.respondWith(networkFirstLiturgy(event.request));
    return;
  }

  // For navigation requests, let the app handle it (SPA)
  // Don't cache other requests to avoid interference
});

async function networkFirstLiturgy(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(LITURGY_CACHE);
      // Use request body as part of cache key via a custom header
      const body = await request.clone().text();
      const cacheKey = request.url + '?body=' + encodeURIComponent(body);
      await cache.put(new Request(cacheKey), response.clone());
    }
    return response;
  } catch (e) {
    // Network failed — try cache
    const cache = await caches.open(LITURGY_CACHE);
    const body = await request.clone().text();
    const cacheKey = request.url + '?body=' + encodeURIComponent(body);
    const cached = await cache.match(new Request(cacheKey));
    if (cached) return cached;
    
    // Nothing in cache either
    return new Response(
      JSON.stringify({ error: 'Offline — sem cache disponível para esta data.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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
    icon: '/favicon.svg',
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
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
