// Service worker HalalCheck v0.10 — cache l'app web pour un démarrage instantané.
// Déploiement : GitHub Pages via .github/workflows/deploy-halalcheck.yml
const CACHE = "halalcheck-v10";

// En rayon, le réseau n'est pas absent : il est LENT. Au-delà de ce délai, une
// copie en cache vaut mieux qu'une page fraîche qui n'arrive jamais.
// Même valeur que le scanner (voir DELAI_RESEAU dans scan.html).
const DELAI_RESEAU = 4000;
const FICHIERS = [
  "./",
  "./index.html",
  "./scan.html",
  "./additifs.html",
  "./mentions-legales.html",
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

/**
 * Réseau d'abord, mais on n'attend jamais indéfiniment.
 *
 * Le piège que ceci corrige : `fetch` n'a aucun délai maximum. Une page
 * pourtant présente en cache restait invisible tant que le réseau n'avait pas
 * répondu — mesuré à 20,1 s avec un réseau retardé de 20 s, alors que la copie
 * locale était disponible immédiatement.
 *
 * On ne coupe PAS la requête réseau : elle continue en arrière-plan et met le
 * cache à jour pour la fois suivante. On arrête seulement de la faire attendre
 * au visiteur. Et sans copie en cache, on attend le réseau quel que soit le
 * temps que ça prend : rien à servir vaut moins qu'une attente.
 */
function reseauDAbordAvecDelai(requete) {
  const reseau = fetch(requete).then((reponse) => {
    const copie = reponse.clone();
    caches.open(CACHE).then((c) => c.put(requete, copie));
    return reponse;
  });

  return caches.match(requete).then((enCache) => {
    if (!enCache) return reseau.catch(() => Response.error());

    return new Promise((resoudre) => {
      let repondu = false;
      const repondreUneFois = (r) => {
        if (repondu) return;
        repondu = true;
        resoudre(r);
      };
      const minuteur = setTimeout(() => repondreUneFois(enCache.clone()), DELAI_RESEAU);
      reseau.then(
        (r) => {
          clearTimeout(minuteur);
          repondreUneFois(r);
        },
        () => {
          clearTimeout(minuteur);
          repondreUneFois(enCache.clone());
        }
      );
    });
  });
}

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
    // Pages HTML + bases de données : réseau d'abord (toujours la dernière
    // version, pour que les nouvelles vérifications arrivent vite), cache en
    // secours — mais AVEC un délai maximum.
    evt.respondWith(reseauDAbordAvecDelai(requete));
    return;
  }
  // Le reste (scripts, images, polices de notre domaine) : cache d'abord, et on
  // GARDE ce qu'on va chercher. Sans ce `put`, un fichier absent de la liste
  // d'installation était re-téléchargé à chaque visite et manquait hors ligne —
  // c'était le cas du lecteur de codes-barres des iPhone.
  //
  // Il n'est volontairement pas dans FICHIERS : 328 Ko imposés à l'installation
  // à tout le monde, alors que Chrome et Edge n'en ont jamais besoin. Il entre
  // dans le cache à la première utilisation réelle, donc dès le premier scan.
  evt.respondWith(
    caches.match(requete).then((hit) => {
      if (hit) return hit;
      return fetch(requete).then((reponse) => {
        if (reponse && reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then((c) => c.put(requete, copie));
        }
        return reponse;
      });
    })
  );
});
