/**
 * Retrouve Playwright et Chromium quel que soit l'atelier.
 *
 * Pourquoi ce fichier existe : le 11 août, `npm run sonde:photo` échouait sur
 * « Cannot find package 'playwright' ». La sonde écrite la veille était donc
 * inutilisable — une sonde qui ne démarre pas ne mesure rien, et pire, elle
 * laisse croire que la vérification existe. Playwright est installé
 * globalement ici, pas dans le dossier du projet : `import "playwright"` ne le
 * trouve pas depuis `scripts/`.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

export async function chargerPlaywright() {
  let mod;
  try {
    mod = await import("playwright");
  } catch (e) {
    const racine = execSync("npm root -g", { encoding: "utf8" }).trim();
    mod = await import(pathToFileURL(racine + "/playwright/index.js").href);
  }
  // Chargé par son chemin, Playwright arrive en module CommonJS : le contenu
  // est alors sous `default`, et `chromium` serait `undefined` sans cette ligne.
  return mod.chromium ? mod : mod.default;
}

/** Chromium est préinstallé dans l'atelier ; sinon Playwright prend le sien. */
export function cheminChromium() {
  const candidats = [
    process.env.CHROMIUM_ATELIER,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome",
  ].filter(Boolean);
  return candidats.find((c) => existsSync(c)); // undefined = Playwright décide
}
