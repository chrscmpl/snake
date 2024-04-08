const cacheName = 'snake-cache';

let filesToCache = [
  '/',
  '/index.html',
  '/normalize.css',
  '/manifest.json',
  '/game-config.json',
  #JS#
  #ASSETS#
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (response) {
      return response || fetch(e.request);
    })
  );
});
