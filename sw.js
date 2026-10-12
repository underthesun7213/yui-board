/* Bump CACHE on every deploy — it is what forces phones to pick up new code. */
const CACHE = "yui-v4";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./icon-180.png",
  "./vendor/leaflet/leaflet.js",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet.markercluster/leaflet.markercluster.js",
  "./vendor/leaflet.markercluster/MarkerCluster.css",
  "./data/japan-prefectures.geojson"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      // only our own old caches: other apps may share this origin (github.io)
      .then(keys => Promise.all(keys.filter(k => k.startsWith("yui-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Map tiles and other hosts are left to the browser: they are not ours to cache.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations and data: try the network first so a redeploy shows up
  // immediately; fall back to cache when the dorm wifi drops.
  const isDoc = req.mode === "navigate" || /\.(json|geojson)$/.test(url.pathname);

  if (isDoc) {
    e.respondWith(
      fetch(req)
        .then(res => {
          // never keep an error page: it would be served offline
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" })
          .then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Static assets: cache first.
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
