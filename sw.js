const CACHE = 'mind-expansion-shell-v8';
const SHELL = [
  './catalog.js?v=8', './media/beluga.jpg', './media/octopus-hunt.jpg', './media/voss-mirror.jpg',
  './book-stories.js?v=8', './preferences.js?v=8', './', './index.html', './styles.css?v=8', './app.js?v=8', './learning.js?v=8', './cards.js?v=8',
  './feed.js?v=8', './storage.js?v=8', './swipe.js?v=8', './swipe.css?v=8', './swipe-stories.js?v=8', './swipe-art.js?v=8', './swipe-media.js?v=8', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png', './evidence.js?v=8', './deep-cuts.js?v=8', './deep-art.js?v=8', './lessons.js?v=8', './source-lessons.js?v=8',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(path => new Request(path, { cache: 'reload' })))));
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
    || !url.href.startsWith(self.registration.scope)
    || ['/signin-with-chatgpt', '/signout-with-chatgpt', '/callback'].includes(url.pathname)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }).catch(() => caches.match('./index.html')));
  } else if (SHELL.some(path => new URL(path, self.registration.scope).pathname === url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
