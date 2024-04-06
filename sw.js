const cacheName = 'snake-cache';

const locations = [
  './snake_assets/stage1/',
  './snake_assets/stage2/',
  './snake_assets/stage3/',
  './snake_assets/stage-special/',
];

const assets = [
  'body_bottomleft.webp',
  'body_bottomright.webp',
  'body_horizontal.webp',
  'body_topleft.webp',
  'body_topright.webp',
  'body_vertical.webp',
  'food.webp',
  'head_dead_down.webp',
  'head_dead_left.webp',
  'head_dead_right.webp',
  'head_dead_up.webp',
  'head_down.webp',
  'head_left.webp',
  'head_right.webp',
  'head_up.webp',
  'tail_down.webp',
  'tail_left.webp',
  'tail_right.webp',
  'tail_up.webp',
];

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
  '/snake_assets/stage1/background.webp',
  '/snake_assets/stage1/tile.webp',
  '/snake_assets/stage2/tile.webp',
  '/snake_assets/stage3/tile.webp',
  '/snake_assets/stage-special/tile.webp',
  '/snake_assets/stage1/theme.mp3',
  '/snake_assets/stage2/theme.mp3',
  '/snake_assets/stage3/theme.mp3',
  '/snake_assets/stage1/near-food.mp3',
  '/snake_assets/stage1/on-eat.mp3',
  '/snake_assets/stage1/on-game-over.mp3',
  '/snake_assets/stage1/on-pause.mp3',
  '/snake_assets/stage1/on-unpause.mp3',
];

for (const asset of assets) {
  for (const location of locations) {
    filesToCache.push(location + asset);
  }
}

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
