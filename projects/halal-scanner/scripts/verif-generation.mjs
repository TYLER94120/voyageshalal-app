#!/usr/bin/env node
/**
 * Le site livré est-il celui que les générateurs produisent ?
 *
 * POURQUOI. `additifs.html` et les 6 pages rayon sont FABRIQUÉES depuis le
 * moteur. Si quelqu'un corrige une page à la main, sa correction sera effacée
 * à la régénération suivante — faute du 13 août, où j'avais retiré des liens
 * Google du fichier produit et vu le générateur les remettre. Pire : entre les
 * deux, la page affirme une règle que le moteur n'applique pas.
 *
 * POURQUOI CE N'EST PAS UN SIMPLE `git diff`. Ma première version l'était.
 * Elle était rouge à chaque envoi, pour une raison qui n'a rien à voir avec
 * le contenu : les pages portent la date du dernier commit qui les touche,
 * et cette date change à chaque commit. Écart mesuré entre deux passages :
 * une seconde — 10:51:07 contre 10:51:08.
 *
 * On compare donc tout SAUF les horodatages, qui viennent de l'historique git
 * et ne peuvent pas être reproduits à un autre instant. Les dates ont leur
 * propre contrôle, dans verif:chiffres : page et sitemap doivent s'accorder.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const PROJET = join(ICI, "..");
const SITE = join(PROJET, "site");

const MANIFESTE = JSON.parse(readFileSync(join(ICI, "pages-du-site.json"), "utf8"));
// Seules les pages GÉNÉRÉES sont concernées : les 6 rayons et additifs.html.
const GENEREES = [...MANIFESTE.filter((p) => p.etiquette).map((p) => p.fichier), "additifs.html"];

/** Neutralise ce qui vient de l'horloge de git, pas du moteur. */
function sansDates(t) {
  return t
    .replace(/<meta name="last-modified" content="[^"]*"/g, '<meta name="last-modified" content="—"')
    .replace(/"dateModified": "[^"]*"/g, '"dateModified": "—"')
    .replace(/Mis à jour le [^<]*/g, "Mis à jour le —");
}

// On met le site de côté, on régénère, on compare, on remet.
const abri = mkdtempSync(join(tmpdir(), "halalcheck-"));
cpSync(SITE, join(abri, "site"), { recursive: true });
const avant = new Map(GENEREES.map((f) => [f, readFileSync(join(SITE, f), "utf8")]));

try {
  for (const script of ["page-additifs.mjs", "pages-rayons.mjs"]) {
    execFileSync("node", [join(ICI, script)], { cwd: PROJET, stdio: "pipe" });
  }
} catch (e) {
  console.log("✗ un générateur a échoué :\n" + String(e.stderr || e.message).slice(0, 400));
  cpSync(join(abri, "site"), SITE, { recursive: true });
  process.exit(1);
}

let fautes = 0;
console.log("LE SITE LIVRÉ EST-IL CELUI QUE LES GÉNÉRATEURS PRODUISENT ?\n");
for (const f of GENEREES) {
  const apres = readFileSync(join(SITE, f), "utf8");
  const identique = sansDates(avant.get(f)) === sansDates(apres);
  if (!identique) fautes += 1;
  console.log(
    `  ${identique ? "✓" : "✗"} ${f.padEnd(24)}` +
      (identique ? "conforme au générateur" : "← LE FICHIER LIVRÉ A ÉTÉ MODIFIÉ À LA MAIN")
  );
}

// On remet exactement ce qui était là : ce contrôle ne modifie jamais le site.
cpSync(join(abri, "site"), SITE, { recursive: true });

console.log(
  "\n" +
    (fautes
      ? `✗ ${fautes} page(s) livrée(s) diffèrent de ce que le moteur produit.\n  Corrige le GÉNÉRATEUR, pas le fichier : la page sera réécrite.`
      : `✓ Les ${GENEREES.length} pages générées correspondent au moteur.`)
);
process.exit(fautes ? 1 : 0);
