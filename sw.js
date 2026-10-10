// Flights service worker: the whole app works offline. It never stores flight data (that lives in the browser's localStorage).
const CACHE = "flights-202610102021";          // this version's page
const STATIC = "flights-static-v1";      // logos, flags, map textures, airport lists, d3: kept across versions
const TILES = "flights-tiles-v1";        // map imagery tiles (pictures of the Earth only), kept across versions
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const ASSETS = ["./d3.min.js", "./airports.json", "./airlines.json", "./world.json", "./world-mid.json", "./tex/earth-day.jpg", "./tex/earth-night.jpg"];
self.addEventListener("install", e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c => c.addAll(CORE)),
    caches.open(STATIC).then(c => Promise.all(ASSETS.map(u => c.match(u, { ignoreSearch:true }).then(hit => hit || c.add(u).catch(() => {}))))),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== STATIC && k !== TILES && k !== "flights-cal").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const timeout = (p, ms) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error("timeout")), ms); p.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); no(e); }); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // a calendar event made by the app on this phone: answered like a server would, so iOS opens "Add to Calendar"
  if (url.origin === self.location.origin && /\/evento\/[^/]+\.ics$/.test(url.pathname)) {
    e.respondWith(caches.open("flights-cal").then(c => c.match(url.pathname)).then(hit => hit ? hit.text().then(t => new Response(t, { status:200, headers:{
      "Content-Type":"text/calendar; charset=utf-8", "Content-Disposition":"attachment; filename=\"" + url.pathname.split("/").pop() + "\"", "Cache-Control":"no-store" } })) : fetch(req)));
    return;
  }
  if (req.mode === "navigate") { // newest page when online; the saved one when offline or the network is too slow
    e.respondWith(timeout(fetch(req, { cache:"no-cache" }), 4000).then(r => { if (r.ok && /\/(index\.html)?$/.test(url.pathname)) { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch:true }).then(h => h || caches.match("./index.html", { ignoreSearch:true })).then(hit => hit || caches.match("./", { ignoreSearch:true }))));
    return;
  }
  // map imagery tiles and plane photos (public pictures, no personal data): kept on the phone so they show at once and offline
  if (["server.arcgisonline.com", "gibs.earthdata.nasa.gov", "tiles.maps.eox.at"].includes(url.host) || /(^|\.)plnspttrs\.net$/.test(url.host)) {
    e.respondWith(caches.open(TILES).then(c => c.match(req.url).then(hit => hit || fetch(req).then(r => {
      if (r.ok || (r.type === "opaque" && /plnspttrs/.test(url.host))) { c.put(req.url, r.clone()); if (Math.random() < 0.02) c.keys().then(ks => { if (ks.length > 5000) ks.slice(0, ks.length - 4500).forEach(k => c.delete(k)); }); }
      return r;
    }))));
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
