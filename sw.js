const CACHE = 'casuya-v1';
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './fonts/PlusJakartaSans-400.ttf',
  './fonts/PlusJakartaSans-500.ttf',
  './fonts/PlusJakartaSans-600.ttf',
  './fonts/PlusJakartaSans-700.ttf',
  './fonts/PlusJakartaSans-800.ttf',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      });
      return cached || fetched;
    }),
  );
});
