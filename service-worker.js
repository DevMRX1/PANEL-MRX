self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Notificación", body: event.data?.text?.() || "" };
  }

  const title = data.title || "Notificación";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",     // ajusta si tienes otro
    badge: "/badge-72.png",    // opcional
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const client = allClients.find(c => c.url.includes(self.location.origin));
      if (client) return client.focus();
      return self.clients.openWindow(url);
    })()
  );
});
