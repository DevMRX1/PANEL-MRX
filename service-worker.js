// ✅ sw.js completo (PWA + Push + Click + Cache opcional)
// Guarda este archivo como: /sw.js (en la raíz) o /public/sw.js según tu proyecto.

const CACHE_NAME = "mrx-cache-v6"; // cambia el número si actualizas

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Borra caches viejos
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
    );

    await self.clients.claim();
  })());
});

/**
 * ✅ PUSH: cuando llega una notificación push
 * Tu server manda JSON: { title, body, url }
 */
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch (e) {
      // fallback por si llega texto
      data = { title: "Notificación", body: event.data?.text?.() || "" };
    }

    const title = data.title || "Notificación";
    const options = {
      body: data.body || "",
      // ✅ pon tus icons si los tienes en tu /public
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/badge-72.png",
      data: {
        url: data.url || "/", // a dónde ir al hacer click
      },
      // Opcional: vibración (Android)
      vibrate: [100, 50, 100],
    };

    await self.registration.showNotification(title, options);
  })());
});

/**
 * ✅ CLICK: cuando el usuario toca la notificación
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    // Si ya hay una pestaña abierta, enfócala
    for (const client of allClients) {
      if (client.url.includes(url) && "focus" in client) {
        return client.focus();
      }
    }

    // Si no hay, abre nueva
    if (clients.openWindow) return clients.openWindow(url);
  })());
});

/**
 * ✅ FETCH (opcional): cache simple para GET
 * Si no quieres cache, puedes borrar todo este bloque.
 */
self.addEventListener("fetch", (event) => {
  // Solo cachea GET http/https
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
