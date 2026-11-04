// ESOL development preview: keep only the public shell for offline fallback.
// No account data, learner progress, assessment responses or payments are cached here.
const CACHE_NAME = "be-esol-shell-v1";
const FALLBACK = "/esol/";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.add(FALLBACK)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("be-esol-shell-") && k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(FALLBACK).then(res => res || Response.error())));
});
