const CACHE = 'demomq-v3';

const PRECACHE = [
  '/',
  '/offline.html',
  '/styles/styles.css',
  '/styles/lazy-styles.css',
  '/scripts/scripts.js',
  '/fonts/roboto-regular.woff2',
  '/fonts/roboto-medium.woff2',
  '/fonts/roboto-bold.woff2',
  '/fonts/roboto-condensed-bold.woff2',
];

async function precacheUrl(cache, url) {
  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) await cache.put(url, response);
  } catch {
    // non-fatal — SW install still succeeds
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(PRECACHE.map((url) => precacheUrl(cache, url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isStaticAsset(url) {
  return /\.(css|js|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/.test(url.pathname);
}

const OFFLINE_RESPONSE = new Response(
  '<h1>You are offline</h1><p>Please reconnect and try again.</p>',
  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
);

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request.url, response.clone());
    return response;
  } catch {
    // match by URL string to avoid Vary-header mismatches
    const cached = await cache.match(request.url);
    if (cached) return cached;
    const offline = await cache.match('/offline.html');
    return offline || OFFLINE_RESPONSE.clone();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request.url);
  if (cached) return cached;
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request.url, response.clone());
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!['https:', 'http:'].includes(url.protocol)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
