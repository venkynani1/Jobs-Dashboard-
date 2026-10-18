// Job Radar service worker: offline app shell, always-fresh job data.
const VERSION = "jr-v2";
const SHELL = ["index.html", "app.js", "resume/resume-render.js", "resume/linkedin-parser.js",
  "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/favicon-32.png"];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com)\//;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // never touch Google sign-in / Gmail API
  if (/googleapis\.com\/gmail|accounts\.google\.com/.test(url.href)) return;
  // this app's own files (incl. job list): network first so updates show at once; cached copy when offline
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(url.pathname, c)); } return r; })
      .catch(() => caches.match(url.pathname).then(hit => hit || caches.match("index.html"))));
    return;
  }
  // CDN libraries and fonts: cache first
  if (CDN.test(url.href)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })));
  }
});
