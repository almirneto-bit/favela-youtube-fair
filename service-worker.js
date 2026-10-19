/* PWA offline: aumentar a versão quando atualizar imagens ou conteúdo. */
const CACHE_VERSION = 'favela-showcase-v2.1.0';
const REVISED_SLIDES = new Set([2, 10, 11, 12, 13, 14, 15, 16, 17]);
const SLIDE_ASSETS = Array.from({ length: 17 }, (_, index) => {
  const number = index + 1;
  return `./assets/slides/tela-${String(number).padStart(2, '0')}${REVISED_SLIDES.has(number) ? '-vina' : ''}.webp`;
});
const CORE_ASSETS = [
  './', './index.html', './styles.css?v=2.1.0', './app.js?v=2.1.0', './slides.js?v=2.1.0',
  './manifest.webmanifest', './favicon.ico',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  ...SLIDE_ASSETS
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE_VERSION).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put('./index.html', response.clone());
        return response;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(event.request, response.clone());
    }
    return response;
  })());
});
