/* Service worker minimal pour Klarte Vie Web.
 * Stratégie : network-first pour la navigation (toujours le contenu frais),
 * cache-first pour les assets statiques. Objectif : installabilité + offline basique.
 */
const CACHE = "klarte-vie-web-v2";
const APP_SHELL = ["/", "/recettes", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

/* Clic sur une notification « recette enregistrée » → focus l'app existante et
 * lui demande d'ouvrir la fiche, sinon ouvre une nouvelle fenêtre en deep-link. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const id = event.notification.data && event.notification.data.recipeId;
  const target = id ? `/recettes?recipe=${id}` : "/recettes";

  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of wins) {
        if (client.url.includes("/recettes")) {
          await client.focus();
          if (id) client.postMessage({ type: "open-recipe", id });
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation → network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Assets statiques → cache-first
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
