const CACHE_NAME = 'dg-sentinel-v3-cache-v3.2';
const ASSETS_TO_CACHE = [
  './index.html',
  './css/style.css',
  './js/app.js',
  './data/trades.json',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 採用 Network-First (網路優先，離線備援) 策略，確保每次有網路皆能取得最新程式碼與交易紀錄
self.addEventListener('fetch', event => {
  if (event.request.url.includes('api.fugle.tw') || event.request.url.includes('news.google.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
