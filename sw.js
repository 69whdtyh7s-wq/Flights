// Flights service worker: works offline, never stores flight data (that lives in the browser's localStorage).
const CACHE = "flights-20261006030031";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") { // always try the newest version first
    e.respondWith(fetch(req, { cache:"no-cache" }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
