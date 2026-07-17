const CACHE_NAME = 'dg-sentinel-v4-cache-v4.5.1_20260717_realtime';
const ASSETS_TO_CACHE = [
  './index.html',
  './css/style.css',
  './js/app.js?v=4.5.1_20260717_realtime',
  './manifest.json',
  './icons/icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
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
  if (event.request.url.includes('api.fugle.tw') || event.request.url.includes('news.google.com') || event.request.url.includes('wargame_report.json') || event.request.url.includes('market_context.json') || event.request.url.includes('trades.json') || event.request.url.startsWith('file:')) {
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
