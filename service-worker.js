/* sw.js */

// (Opcional) cache simple
const CACHE_NAME = "mrx-cache-v6";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

// (Opcional) cache de GET
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        if (event.request.url.startsWith("http")) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ✅ PUSH: aquí se muestra la notificación aunque la app esté cerrada
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Notificación", body: event.data?.text?.() || "" };
  }

  const title = data.title || "MRX";
  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: data.icon || "/apple-touch-icon.png",
    badge: data.badge || "/apple-touch-icon.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ Click en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    // Si ya hay una ventana abierta, enfócala
    for (const client of allClients) {
      if ("focus" in client) return client.focus();
    }

    // Si no, abre una nueva
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
