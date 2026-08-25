/* Golden Eagle Academy — Service Worker
   Estrategia:
   - Precache del "app shell" (HTML, CSS, JS, iconos, logo) para uso offline.
   - Cache-first para los assets propios (versionados por CACHE_VERSION).
   - Stale-while-revalidate para las fuentes de Google.
   - Navegaciones offline: se sirve index.html (SPA con enrutado por hash).
*/
const CACHE_VERSION = "ge-academy-v1";
const APP_SHELL = `${CACHE_VERSION}-shell`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/logo-eagle.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png",
  "./offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isFontRequest(url) {
  return url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navegaciones: red primero, fallback a shell/offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("./index.html").then((r) => r || caches.match("./offline.html"))
      )
    );
    return;
  }

  // Fuentes de Google: stale-while-revalidate.
  if (isFontRequest(url)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((resp) => {
            if (resp && resp.status === 200) cache.put(request, resp.clone());
            return resp;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Assets propios: cache-first con relleno de red.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            const copy = resp.clone();
            caches.open(APP_SHELL).then((cache) => cache.put(request, copy));
            return resp;
          }).catch(() => cached)
      )
    );
  }
});
