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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    try {
      const res = await fetch(event.request);
      const clone = res.clone();

      if (event.request.url.startsWith("http")) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, clone);
      }
      return res;
    } catch (e) {
      const cached = await caches.match(event.request);
      return cached || new Response("Offline", { status: 503 });
    }
  })());
});

// ✅ RECIBIR PUSH Y MOSTRAR NOTIFICACIÓN
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch {
      data = { title: "Notificación", body: event.data?.text?.() || "" };
    }

    const title = data.title || "Créditos agregados 💳";
    const options = {
      body: data.body || "Tienes una actualización.",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/badge-72.png",
      data: { url: data.url || "/" },
      tag: data.tag || "credit-push",
      renotify: true,
    };

    await self.registration.showNotification(title, options);
  })());
});

// ✅ CLICK EN NOTIFICACIÓN
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification?.data?.url || "/";

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    for (const client of allClients) {
      if ("focus" in client) {
        await client.focus();
        try { await client.navigate(urlToOpen); } catch {}
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(urlToOpen);
    }
  })());
});
