// Service worker HalalCheck v0.6 — cache l'app web pour un démarrage instantané.
// Déploiement : GitHub Pages via .github/workflows/deploy-halalcheck.yml
const CACHE = "halalcheck-v6";
const FICHIERS = [
  "./",
  "./index.html",
  "./scan.html",
  "./halal.js",
  "./cosmetiques.js",
  "./verifications.json",
  "./produits-locaux.json",
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
  const url = new URL(requete.url);
  const estPage =
    requete.mode === "navigate" ||
    (requete.headers.get("accept") || "").includes("text/html") ||
    url.pathname.endsWith("verifications.json") ||
    url.pathname.endsWith("produits-locaux.json");
  if (estPage) {
    // Pages HTML + base de vérifications : réseau d'abord (toujours la dernière
    // version, pour que les nouvelles vérifications arrivent vite), cache en secours.
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
