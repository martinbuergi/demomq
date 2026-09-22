const CACHE = 'demomq-v2';

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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(
      PRECACHE.map((url) => cache.add(url).catch(() => {})),
    )).then(() => self.skipWaiting()),
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

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || cache.match('/offline.html');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // only handle same-origin and aem CDN requests
  if (!['https:', 'http:'].includes(url.protocol)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
