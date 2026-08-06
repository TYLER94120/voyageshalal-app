// Service worker HalalCheck v0.2 — cache l'app web pour un démarrage instantané.
// Déploiement : GitHub Pages via .github/workflows/deploy-halalcheck.yml
const CACHE = "halalcheck-v2";
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
  const estPage =
    requete.mode === "navigate" || (requete.headers.get("accept") || "").includes("text/html");
  if (estPage) {
    // Pages HTML : réseau d'abord (toujours la dernière version), cache en secours hors-ligne.
    evt.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE).then((c) => c.put(requete, copie));
          return reponse;
        })
        .catch(() => caches.match(requete).then((hit) => hit || Response.error()))
    );
    return;
  }
  evt.respondWith(caches.match(requete).then((hit) => hit || fetch(requete)));
});
