// Service worker HalalCheck — cache l'app web pour un démarrage instantané.
const CACHE = "halalcheck-v1";
const FICHIERS = [
  "./",
  "./index.html",
  "./scan.html",
  "./halal.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  const requete = evt.request;
  if (requete.method !== "GET" || new URL(requete.url).origin !== self.location.origin) return;
  evt.respondWith(caches.match(requete).then((hit) => hit || fetch(requete)));
});
