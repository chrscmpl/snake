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
  '/snake_assets/stage1/background.png',
  '/snake_assets/stage1/body_bottomleft.png',
  '/snake_assets/stage1/body_bottomright.png',
  '/snake_assets/stage1/body_horizontal.png',
  '/snake_assets/stage1/body_topleft.png',
  '/snake_assets/stage1/body_topright.png',
  '/snake_assets/stage1/body_vertical.png',
  '/snake_assets/stage1/food.png',
  '/snake_assets/stage1/head_dead_down.png',
  '/snake_assets/stage1/head_dead_left.png',
  '/snake_assets/stage1/head_dead_right.png',
  '/snake_assets/stage1/head_dead_up.png',
  '/snake_assets/stage1/head_down.png',
  '/snake_assets/stage1/head_left.png',
  '/snake_assets/stage1/head_right.png',
  '/snake_assets/stage1/head_up.png',
  '/snake_assets/stage1/tail_down.png',
  '/snake_assets/stage1/tail_left.png',
  '/snake_assets/stage1/tail_right.png',
  '/snake_assets/stage1/tail_up.png',
  '/snake_assets/stage1/tile.png',
  
  '/snake_assets/stage2/body_bottomleft.png',
  '/snake_assets/stage2/body_bottomright.png',
  '/snake_assets/stage2/body_horizontal.png',
  '/snake_assets/stage2/body_topleft.png',
  '/snake_assets/stage2/body_topright.png',
  '/snake_assets/stage2/body_vertical.png',
  '/snake_assets/stage2/food.png',
  '/snake_assets/stage2/head_dead_down.png',
  '/snake_assets/stage2/head_dead_left.png',
  '/snake_assets/stage2/head_dead_right.png',
  '/snake_assets/stage2/head_dead_up.png',
  '/snake_assets/stage2/head_down.png',
  '/snake_assets/stage2/head_left.png',
  '/snake_assets/stage2/head_right.png',
  '/snake_assets/stage2/head_up.png',
  '/snake_assets/stage2/tail_down.png',
  '/snake_assets/stage2/tail_left.png',
  '/snake_assets/stage2/tail_right.png',
  '/snake_assets/stage2/tail_up.png',
  '/snake_assets/stage2/tile.png',
  
  '/snake_assets/stage3/body_bottomleft.png',
  '/snake_assets/stage3/body_bottomright.png',
  '/snake_assets/stage3/body_horizontal.png',
  '/snake_assets/stage3/body_topleft.png',
  '/snake_assets/stage3/body_topright.png',
  '/snake_assets/stage3/body_vertical.png',
  '/snake_assets/stage3/food.png',
  '/snake_assets/stage3/head_dead_down.png',
  '/snake_assets/stage3/head_dead_left.png',
  '/snake_assets/stage3/head_dead_right.png',
  '/snake_assets/stage3/head_dead_up.png',
  '/snake_assets/stage3/head_down.png',
  '/snake_assets/stage3/head_left.png',
  '/snake_assets/stage3/head_right.png',
  '/snake_assets/stage3/head_up.png',
  '/snake_assets/stage3/tail_down.png',
  '/snake_assets/stage3/tail_left.png',
  '/snake_assets/stage3/tail_right.png',
  '/snake_assets/stage3/tail_up.png',
  '/snake_assets/stage3/tile.png',
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
