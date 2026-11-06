const CACHE = 'drift-v43';
const ASSETS = ['./', './index.html', './artist.html', './styles.css?v=trail-native-2', './compact-shell.css?v=compact-shell-3', './app.js?v=trail-native-5', './artist.js?v=artist-lane-2', './manifest.webmanifest', './assets/drift-app-icon.svg', './assets/back-home-arrow.svg', './assets/sample-peace-pon-eye-and-eye.jpg', '/portfolio-website/install-apps.css?v=install-note-1', '/portfolio-website/install-app.js?v=install-separate-2', '/portfolio-website/theme-controls.css?v=theme-controls-8', '/portfolio-website/lens-atmosphere.css?v=lens-atmosphere-22', '/portfolio-website/site-theme-init.js?v=colour-world-3', '/portfolio-website/site-theme-control.js?v=colour-world-3', '/portfolio-website/palette-themes.css?v=palette-themes-5', '/portfolio-website/assets/atmosphere/day-sky.svg', '/portfolio-website/assets/atmosphere/day-sky-mobile.svg', '/portfolio-website/assets/atmosphere/night-sky.svg', '/portfolio-website/assets/atmosphere/night-sky-mobile.svg', '/portfolio-website/assets/atmosphere/coastal-birds.svg'];
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
