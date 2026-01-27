/* service-worker.js */

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

// Cache simple GET (opcional)
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

// ✅ PUSH (funciona con app cerrada)
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "MRX",
      body: event.data ? event.data.text() : "Tienes una nueva notificación",
    };
  }

  const title = data.title || "MRX • Créditos";
  const body = data.body || "Has recibido créditos.";
  const url = data.url || "/";

  const options = {
    body,
    icon: data.icon || "/apple-touch-icon.png",
    badge: data.badge || "/apple-touch-icon.png",

    // “Pro” feel
    tag: data.tag || "mrx-credit",
    renotify: true,
    vibrate: [80, 40, 80],
    timestamp: Date.now(),

    // si quieres que no se vaya sola (Android):
    // requireInteraction: true,

    data: { url },

    // (Opcional) acciones (Android/desktop)
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Cerrar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ Click / acciones
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  if (action === "close") return;

  const url = event.notification?.data?.url || "/";

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    // si ya hay una pestaña/app abierta, enfócala
    for (const client of allClients) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(url);
        return;
      }
    }

    // si no, abre una nueva
    if (clients.openWindow) await clients.openWindow(url);
  })());
});
