const CACHE = 'nyarindo-universal-v8';
const CORE = [
  '/',
  '/site.webmanifest',
  '/portfolio-website/install-apps.css?v=install-note-1',
  '/portfolio-website/install-app.js?v=install-note-1',
  '/portfolio-website/lens-atmosphere.css?v=lens-atmosphere-17',
  '/portfolio-website/assets/atmosphere/day-sky.svg',
  '/portfolio-website/assets/atmosphere/day-sky-mobile.svg',
  '/portfolio-website/assets/atmosphere/night-sky.svg',
  '/portfolio-website/assets/atmosphere/night-sky-mobile.svg',
  '/portfolio-website/assets/atmosphere/coastal-birds.svg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map(path => cache.add(path).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE && key.startsWith('nyarindo-universal-')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
