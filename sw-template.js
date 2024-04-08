const cacheName = 'snake-cache';

let filesToCache = [
  '/',
  '/index.html',
  '/normalize.css',
  '/js/main.js',
  '/js/snakeCore.js',
  '/js/snakeGame.js',
  '/js/utils.js',
  '/manifest.json',
  '/game-config.json',
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
