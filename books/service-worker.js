const CACHE = "nyarindo-library-v10";
const CORE = [
  "/books/",
  "/books/index.html",
  "/books/manifest.webmanifest",
  "/books/library.css?v=library-day-3",
  "/books/library-reader.css?v=reader-4",
  "/books/library.js?v=gallery-2",
  "/portfolio-website/theme-controls.css?v=theme-controls-6",
  "/portfolio-website/site-theme-init.js?v=library-1",
  "/portfolio-website/site-theme-control.js?v=theme-controls-6",
  "/books/assets/entering-the-spiral.svg",
  "/books/assets/spiral-beyond.svg",
  "/books/assets/experiment-particles.svg",
  "/books/assets/experiment-fields.svg",
  "/books/assets/library-icon-192.png?v=library-1",
  "/books/assets/library-icon-512.png?v=library-1",
  "/books/assets/library-icon-maskable-192.png?v=library-1",
  "/books/assets/library-icon-maskable-512.png?v=library-1",
  "/portfolio-website/install-app.js?v=install-note-1",
  "/portfolio-website/install-apps.css?v=install-note-1",
  "/portfolio-website/local-fonts.css?v=hd-2",
  "/portfolio-website/assets/books/the-nyarindo-lens-book-01-grammar-of-pulse-thumb.avif",
  "/portfolio-website/assets/books/the-nyarindo-lens-book-01-grammar-of-pulse-thumb.webp",
  "/portfolio-website/assets/books/nyarindo-lens-book-02-the-pulse-reports-thumb.avif",
  "/portfolio-website/assets/books/nyarindo-lens-book-02-the-pulse-reports-thumb.webp",
  "/portfolio-website/assets/books/nyarindo-lens-book-03-stories-we-tell-about-the-pulse-thumb.avif",
  "/portfolio-website/assets/books/nyarindo-lens-book-03-stories-we-tell-about-the-pulse-thumb.webp",
  "/portfolio-website/assets/books/nyarindo-lens-book-04-the-method-in-the-waves-thumb.avif",
  "/portfolio-website/assets/books/nyarindo-lens-book-04-the-method-in-the-waves-thumb.webp",
  "/portfolio-website/assets/books/nyarindo-lens-book-05-attention-thumb.avif",
  "/portfolio-website/assets/books/nyarindo-lens-book-05-attention-thumb.webp",
  "/portfolio-website/assets/books/nyarindo-lens-book-06-teaching-the-wave-mind-thumb.avif",
  "/portfolio-website/assets/books/nyarindo-lens-book-06-teaching-the-wave-mind-thumb.webp",
  "/portfolio-website/assets/books/nyarindo-lens-book-07-the-vacuum-experiment-thumb.avif",
  "/portfolio-website/assets/books/nyarindo-lens-book-07-the-vacuum-experiment-thumb.webp",
  "/portfolio-website/assets/books/nyarindo-lens-collection-cover-spiral-of-reach-and-return.avif",
  "/portfolio-website/assets/books/nyarindo-lens-collection-cover-spiral-of-reach-and-return.webp",
  "/books/reader-content/manifest.json",
  "/books/reader-content/introduction.json",
  "/books/reader-content/the-nyarindo-lens.json",
  "/books/reader-content/the-pulse-reports.json",
  "/books/reader-content/stories-we-tell-about-the-pulse.json",
  "/books/reader-content/the-method-in-the-waves.json",
  "/books/reader-content/attention.json",
  "/books/reader-content/teaching-the-wave-mind.json",
  "/books/reader-content/the-vacuum-experiment.json",
  "/books/reader-content/collection.json",
  "/books/reader-content/end-note.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map((path) => cache.add(path).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== CACHE && key.startsWith("nyarindo-library-"))
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
        return response;
      } catch {
        return (
          (await caches.match(request))
          || (await caches.match("/books/"))
          || Response.error()
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then((response) => {
      if (response.ok) {
        caches.open(CACHE).then((cache) => {
          cache.put(request, response.clone());
        });
      }
      return response;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
