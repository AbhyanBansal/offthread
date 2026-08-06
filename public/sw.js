// Minimal service worker: makes OFFTHREAD installable as a PWA without caching
// dynamic content (so cart, inventory and prices are never stale). Requests
// pass straight through to the network; the presence of a fetch handler is what
// satisfies installability.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // no-op — let the browser handle every request over the network
});
