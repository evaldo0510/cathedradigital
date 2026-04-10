// Cathedra Service Worker — Push Notifications + Offline Cache
const CACHE_NAME = 'cathedra-v1';
const LITURGY_CACHE = 'cathedra-liturgy-v1';

// Static assets to pre-cache (app shell)
const APP_SHELL = [
  '/',
  '/favicon.svg',
];

// ─── Install: cache app shell ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ───
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
