const CACHE = 'mind-expansion-shell-v5';
const SHELL = [
  './', './index.html', './styles.css?v=5', './app.js?v=5', './learning.js?v=5', './cards.js?v=5',
  './feed.js?v=5', './storage.js?v=5', './swipe.js?v=5', './swipe.css?v=5', './swipe-stories.js?v=5', './swipe-art.js?v=5', './swipe-media.js?v=5', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png', './evidence.js?v=5', './deep-cuts.js?v=5', './deep-art.js?v=5', './lessons.js?v=5', './source-lessons.js?v=5',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('mind-expansion-shell-') && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin
    || !url.href.startsWith(self.registration.scope)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
  } else if (SHELL.some(path => new URL(path, self.registration.scope).pathname === url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
