// Flights service worker: the whole app works offline. It never stores flight data (that lives in the browser's localStorage).
const CACHE = "flights-20261009093440";          // this version's page
const STATIC = "flights-static-v1";      // logos, flags, map textures, airport lists, d3: kept across versions
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const ASSETS = ["./d3.min.js", "./airports.json", "./airlines.json", "./world.json", "./world-mid.json", "./tex/earth-day.jpg", "./tex/earth-night.jpg"];
self.addEventListener("install", e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c => c.addAll(CORE)),
    caches.open(STATIC).then(c => Promise.all(ASSETS.map(u => c.match(u, { ignoreSearch:true }).then(hit => hit || c.add(u).catch(() => {}))))),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== STATIC).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const timeout = (p, ms) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error("timeout")), ms); p.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); no(e); }); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") { // newest page when online; the saved one when offline or the network is too slow
    e.respondWith(timeout(fetch(req, { cache:"no-cache" }), 4000).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); } return r; })
      .catch(() => caches.match("./index.html", { ignoreSearch:true }).then(hit => hit || caches.match("./", { ignoreSearch:true }))));
    return;
  }
  const same = url.origin === self.location.origin;
  if (!same && !["cdnjs.cloudflare.com", "cdn.jsdelivr.net"].includes(url.host)) return;   // other sites (flight lookup): network only
  // assets: answer from the saved copy at once, refresh it in the background when online
  e.respondWith(caches.open(STATIC).then(c => c.match(req, { ignoreSearch:true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) c.put(req.url.split("?")[0], r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => caches.match(req, { ignoreSearch:true }));
  })));
});
