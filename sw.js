// Service worker for the R0 spike kit.
// - Pages: network first, fall back to cache (so updates arrive, offline still works).
// - Libraries and other files: cache first (big files download once).
// - Never touches Google sign-in or API traffic (cross-origin requests pass straight through).

const CACHE = 'sgr0-v3';
const SHELL = [
    './', './index.html', './results.html', './manifest.webmanifest',
    './icons/icon-192.png', './icons/icon-512.png',
    './common/style.css', './common/util.js', './common/report.js', './common/google.js',
    './common/idb.js', './common/md5.js',
    './spikes/1-camera/index.html', './spikes/2-google/index.html', './spikes/3-ocr/index.html',
    './spikes/4-barcode/index.html', './spikes/5-edges/index.html', './spikes/6-offline/index.html',
    './spikes/4-barcode/retest.html', './spikes/6-offline/recovery.html', './spikes/1-camera/photo-sizes.html',
  ];

self.addEventListener('install', (e) => {
    // cache: 'reload' bypasses the browser's HTTP cache, so a new version never stores stale copies.
                        e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys()
                    .then(keys => Promise.all(keys.filter(k => k.startsWith('sgr0-') && k !== CACHE).map(k => caches.delete(k))))
                    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    const isPage = req.mode === 'navigate' || req.destination === 'document';
    if (isPage) {
          e.respondWith(fetch(req).then(res => {
                  const copy = res.clone();
                  caches.open(CACHE).then(c => c.put(req, copy));
                  return res;
          }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
          return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
    })));
});
