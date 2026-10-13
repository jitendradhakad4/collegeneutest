// CollegeNEU service worker: lets the app open quickly and work offline for the app shell.
const VERSION = "collegeneu-v1";
const SHELL = ["./", "index.html", "app.js", "app.css", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache data from Supabase: posts must always be fresh
  if (url.hostname.endsWith("supabase.co") || url.hostname.endsWith("supabase.in")) return;
  // App files: network first (so updates arrive), fall back to cache when offline
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes("jsdelivr") || url.hostname.includes("gstatic") || url.hostname.includes("googleapis"))) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
