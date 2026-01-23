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
