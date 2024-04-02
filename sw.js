var cacheName = 'snake-cache';
var filesToCache = [
  '/',
  '/index.html',
  '/normalize.css',
  '/js/main.js',
  '/js/snakeGame.js',
  '/js/snakeGameGUI.js',
  '/js/utils.js',
  '/manifest.json',
  '/snake_assets/background.png',
  '/snake_assets/body_bottomleft.png',
  '/snake_assets/body_bottomright.png',
  '/snake_assets/body_horizontal.png',
  '/snake_assets/body_topleft.png',
  '/snake_assets/body_topright.png',
  '/snake_assets/body_vertical.png',
  '/snake_assets/food.png',
  '/snake_assets/head_dead_down.png',
  '/snake_assets/head_dead_left.png',
  '/snake_assets/head_dead_right.png',
  '/snake_assets/head_dead_up.png',
  '/snake_assets/head_down.png',
  '/snake_assets/head_left.png',
  '/snake_assets/head_right.png',
  '/snake_assets/head_up.png',
  '/snake_assets/tail_down.png',
  '/snake_assets/tail_left.png',
  '/snake_assets/tail_right.png',
  '/snake_assets/tail_up.png',
  '/snake_assets/tile.png',
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (response) {
      return response || fetch(e.request);
    })
  );
});
