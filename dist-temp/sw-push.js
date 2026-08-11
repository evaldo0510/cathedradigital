// Push notification service worker
self.addEventListener("push", function (event) {
  let data = { title: "Cathedra", body: "Nova mensagem", url: "/dashboard" };
  try {
    data = event.data.json();
  } catch (e) {
    // fallback
  }

  const options = {
    body: data.body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: { url: data.url || "/dashboard" },
    vibrate: [100, 50, 100],
    actions: [{ action: "open", title: "Abrir" }],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Cathedra", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
