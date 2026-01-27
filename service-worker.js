/* service-worker.js (Android + iOS) */

const CACHE_NAME = "mrx-cache-v8"; // 🔁 súbelo cada vez que cambies el SW

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

// ✅ PUSH (Android + iOS PWA)
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

  const title = data.title || "MRX";
  const body = data.body || "Tienes una nueva notificación";
  const url = data.url || data?.data?.url || "/";

  const options = {
    body,

    // ✅ Esto es lo único que controlas desde push para “iconos”
    // En Android: icon = icono pequeño (status bar / encabezado)
    // En iOS PWA: icon = el que suele verse
    icon: data.icon || "/icon-192.png",

    // ✅ Badge Android (iconito monocromo/chiquito)
    badge: data.badge || "/badge-72.png",

    // ❌ NO image, porque eso es banner grande
    // image: ...

    tag: data.tag || "mrx-credit",
    renotify: true,
    vibrate: Array.isArray(data.vibrate) ? data.vibrate : [80, 40, 80],
    timestamp: Date.now(),

    data: {
      url,
      kind: data.kind || data.tag || "mrx",
    },

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
  if (event.action === "close") return;

  const url = event.notification?.data?.url || "/";

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    for (const client of allClients) {
      try {
        if ("focus" in client) await client.focus();
        if ("navigate" in client) await client.navigate(url);
        return;
      } catch (_) {}
    }

    if (clients.openWindow) await clients.openWindow(url);
  })());
});
