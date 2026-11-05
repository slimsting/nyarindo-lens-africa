const CACHE = 'drift-v23';
const ASSETS = ['./', './index.html', './artist.html', './styles.css?v=theme-controls-6', './app.js?v=theme-controls-5', './artist.js', './manifest.webmanifest', './assets/drift-app-icon.svg', './assets/back-home-arrow.svg', '/portfolio-website/install-apps.css?v=install-apps-3', '/portfolio-website/install-app.js?v=install-apps-3', '/portfolio-website/lens-atmosphere.css?v=lens-atmosphere-17', '/portfolio-website/assets/atmosphere/day-sky.svg', '/portfolio-website/assets/atmosphere/day-sky-mobile.svg', '/portfolio-website/assets/atmosphere/night-sky.svg', '/portfolio-website/assets/atmosphere/night-sky-mobile.svg', '/portfolio-website/assets/atmosphere/coastal-birds.svg'];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE)
    .then(cache => cache.addAll(ASSETS))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ])
));
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
