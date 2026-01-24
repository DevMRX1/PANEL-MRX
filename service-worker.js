const CACHE_NAME = "mrx-cache-v5"; // ⬅️ Cambia el número cada vez que actualices

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {

    // Borra caches viejos
    const keys = await caches.keys();

    await Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    );

    await self.clients.claim();

  })());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(

    fetch(event.request)
      .then(response => {

        // Guarda en cache solo archivos válidos
        const clone = response.clone();

        if (
          event.request.method === "GET" &&
          event.request.url.startsWith("http")
        ) {
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
        }

        return response;

      })
      .catch(() => {
        return caches.match(event.request);
      })

  );
});

// ✅ PUSH: mostrar notificación cuando llegue
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}

  const title = data.title || "PANEL MRX";
  const options = {
    body: data.body || "Tienes una actualización",
    icon: "/apple-touch-icon.png",
    badge: "/apple-touch-icon.png",
    data: { url: data.url || "/" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ al tocar la notificación, abrir el panel
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
