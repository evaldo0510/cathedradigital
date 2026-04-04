self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {
    title: 'Lembrete de Oração',
    body: 'É hora da sua oração diária.',
    icon: '/favicon.ico'
  };

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});
