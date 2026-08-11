/**
 * Sert le dossier `site/` pendant qu'une sonde tourne, et s'arrête ensuite.
 *
 * Pourquoi ce fichier existe : le 11 août, `npm run sonde:photo` s'arrêtait sur
 * `ERR_CONNECTION_REFUSED`. La sonde avait bien été rendue autonome pour
 * Playwright et pour sa photo d'essai — mais elle attendait toujours un serveur
 * sur le port 8099 que personne ne lançait. `sonde-iphone.mjs` le demandait en
 * commentaire ; un commentaire n'a jamais démarré un serveur.
 *
 * Une sonde qui ne démarre pas ne mesure rien, et fait croire que la
 * vérification existe. C'est exactement le défaut que ces sondes traquent dans
 * le produit, à un étage au-dessus.
 *
 * Port 0 : le système en attribue un libre. Un port fixe finit toujours par
 * tomber sur un serveur oublié d'une session précédente, qui répond — et sert
 * alors une ANCIENNE version du site. La sonde passerait au vert sur du code
 * qui n'est plus le nôtre.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(fileURLToPath(new URL("../", import.meta.url)), "site");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
};

/** Démarre le serveur. Rend { base, arreter }. */
export async function servirLeSite() {
  const serveur = createServer(async (req, res) => {
    // On coupe la requête au « ? » : les sondes ouvrent des adresses comme
    // scan.html?code=611… et le nom de fichier n'inclut pas la question.
    let chemin = decodeURIComponent(req.url.split("?")[0]);
    if (chemin.endsWith("/")) chemin += "index.html";
    // `normalize` puis retrait des « .. » : une sonde ne doit pas pouvoir lire
    // hors de `site/`, même par accident.
    const fichier = join(SITE, normalize(chemin).replace(/^(\.\.[/\\])+/, ""));
    try {
      const corps = await readFile(fichier);
      res.writeHead(200, {
        "Content-Type": TYPES[extname(fichier).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(corps);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404");
    }
  });

  await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
  const { port } = serveur.address();
  return {
    base: `http://127.0.0.1:${port}`,
    arreter: () => new Promise((ok) => serveur.close(ok)),
  };
}
