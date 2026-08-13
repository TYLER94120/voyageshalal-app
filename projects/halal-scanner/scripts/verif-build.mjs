/**
 * Le fichier SERVI correspond-il vraiment à la source ?
 *
 * Le défaut que ce contrôle rattrape, mesuré le 13 août 2026 — et c'est le
 * plus vicieux rencontré jusqu'ici, parce qu'il annule silencieusement
 * n'importe quelle correction du moteur.
 *
 * Un cycle précédent avait corrigé « l'étiquette végane servait de
 * laissez-passer » dans `lib/halal.ts`, avec son commit et ses explications.
 * Mais `site/halal.js` — le fichier que le navigateur exécute, et que TOUTES
 * les sondes lisent — n'avait pas été recompilé. Résultat, sur le moteur
 * réellement en ligne :
 *
 *     vegane + etiquette « non halal »   ->  HALAL   (alerte affichee dessous)
 *     vegane + gelatine                  ->  HALAL
 *     vegane + carmin                    ->  HALAL
 *
 * Après recompilation : DOUTEUX, DOUTEUX, DOUTEUX.
 *
 * Pourquoi aucune sonde ne l'a vu : elles lisent toutes `site/*.js`. Un build
 * périmé leur fait donc tester l'ANCIEN moteur — et passer. Le commit disait
 * « corrigé », les contrôles étaient verts, et le site servait le défaut.
 *
 * Ce contrôle recompile dans un dossier à part et compare, octet pour octet.
 * Il ne corrige rien tout seul : il refuse de laisser partir un moteur dont
 * la version servie n'est pas la version écrite.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const PROJET = join(ICI, "..");
const TEMOIN = join(PROJET, ".test-build", "temoin");

const FICHIERS = ["halal.js", "cosmetiques.js"];

rmSync(TEMOIN, { recursive: true, force: true });
mkdirSync(TEMOIN, { recursive: true });

// Exactement les options de `npm run build:site`. Si elles changent là-bas,
// elles doivent changer ici — sinon ce contrôle compare deux choses
// différentes et croit détecter une dérive qui n'existe pas.
const OPTIONS = [
  "lib/halal.ts", "lib/cosmetiques.ts",
  "--outDir", ".test-build/temoin",
  "--module", "es2015", "--target", "es2019",
  "--moduleResolution", "node", "--skipLibCheck",
];

console.log("VÉRIFICATION : le moteur servi est-il celui qui est écrit ?\n");
try {
  execFileSync("npx", ["--no-install", "tsc", ...OPTIONS], { cwd: PROJET, stdio: "pipe" });
} catch (e) {
  // tsc absent du projet : on tente le global, comme le fait build:site en CI.
  try {
    execFileSync("tsc", OPTIONS, { cwd: PROJET, stdio: "pipe" });
  } catch (e2) {
    const sortie = String((e2.stdout || "") + (e2.stderr || "")).trim();
    console.log("✗ La compilation a échoué — impossible de comparer.");
    if (sortie) console.log(sortie.split("\n").slice(0, 8).map((l) => "    " + l).join("\n"));
    process.exit(1);
  }
}

let ecarts = 0;
for (const f of FICHIERS) {
  const servi = join(PROJET, "site", f);
  const temoin = join(TEMOIN, f);
  if (!existsSync(temoin)) {
    console.log(`  ✗ ${f.padEnd(18)} la compilation n'a rien produit`);
    ecarts += 1;
    continue;
  }
  const a = readFileSync(servi);
  const b = readFileSync(temoin);
  const pareil = a.equals(b);
  if (!pareil) ecarts += 1;
  console.log(
    `  ${pareil ? "✓" : "✗"} ${f.padEnd(18)} ${pareil ? "identique à la source" : `PÉRIMÉ — ${a.length} octets servis, ${b.length} attendus`}`
  );
}

rmSync(TEMOIN, { recursive: true, force: true });

if (ecarts > 0) {
  console.log(
    `\n✗ ${ecarts} fichier(s) servis ne correspondent plus à lib/. Le site exécute` +
      "\n  une version que personne n'a relue, et les sondes testent celle-là." +
      "\n  Relance : npm run build:site"
  );
  process.exit(1);
}
console.log("\n✓ Le moteur servi est exactement celui qui est écrit dans lib/.");
