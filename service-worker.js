const CACHE_NAME = "mrx-cache-v6"; // ⬅️ sube número para actualizar

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        if (event.request.method === "GET" && event.request.url.startsWith("http")) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ✅ ESTE ES EL PUNTO CLAVE: RECIBIR PUSH Y MOSTRAR NOTIFICACIÓN
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}

  const title = data.title || "PANEL MRX";
  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: "apple-touch-icon.png",     // pon tu icon si tienes
    badge: "apple-touch-icon.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ Al tocar la notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification?.data?.url) || "/";

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    // si ya hay una ventana abierta, enfócala
    for (const client of allClients) {
      if ("focus" in client) return client.focus();
    }

    // si no, abre una nueva
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
