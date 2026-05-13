// Gaming Primitives hub SW. Hand-rolled, KikaCentroid-derived.
// Bump CACHE_VERSION when shipping a new build.
const CACHE_VERSION = 'v0.2.3';
const PRECACHE = `gp-hub-precache-${CACHE_VERSION}`;
const RUNTIME  = `gp-hub-runtime-${CACHE_VERSION}`;

// Derive the SW's served path so PRECACHE_URLS and fetch-handler checks
// work at any base path (root in dev, /gaming-primitives/ in CI deploy).
const SCOPE_PATH = self.location.pathname.replace(/sw\.js$/, '');

const PRECACHE_URLS = [
  SCOPE_PATH,
  SCOPE_PATH + 'taxonomy/',
  SCOPE_PATH + 'era/',
  SCOPE_PATH + 'about/',
  SCOPE_PATH + 'offline.html',
  SCOPE_PATH + 'manifest.webmanifest',
  SCOPE_PATH + 'icons/icon-192.png',
  SCOPE_PATH + 'icons/icon-512.png',
  SCOPE_PATH + 'icons/icon-maskable-512.png',
  SCOPE_PATH + 'icons/apple-touch-icon-180.png',
  SCOPE_PATH + 'icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('gp-hub-') && k !== PRECACHE && k !== RUNTIME)
      .map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (_) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Mini-game scope is NOT ours — let those SWs handle it.
  if (url.pathname.startsWith(SCOPE_PATH + 'g/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(navigationHandler(event));
    return;
  }
  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req, RUNTIME));
    return;
  }
  if (req.destination === 'manifest') {
    event.respondWith(networkFirst(req, PRECACHE));
    return;
  }
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'font') {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }
  event.respondWith(cacheFirst(req, RUNTIME));
});

async function navigationHandler(event) {
  const cache = await caches.open(PRECACHE);
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const network = preload || await timeout(fetch(event.request), 3000);
    if (network && network.ok && network.type === 'basic') {
      cache.put(event.request, network.clone()).catch(() => {});
      return network;
    }
    throw new Error('nav not ok');
  } catch (_) {
    const cached = await cache.match(event.request) || await cache.match(SCOPE_PATH);
    if (cached) return cached;
    return cache.match(SCOPE_PATH + 'offline.html');
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    if (req.destination === 'image') return transparentPng();
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  return cached || (await network) || (await cache.match(req));
}

function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

function transparentPng() {
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { 'Content-Type': 'image/png' } });
}
