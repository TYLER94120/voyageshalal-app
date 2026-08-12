/**
 * Public cible : le Maghreb. Les etiquettes y sont bilingues, parfois
 * uniquement en arabe. Le moteur ne comprend pas l'arabe : il connait une
 * liste courte de mots ecrits en arabe (lib/halal.ts, « Les mots arabes que
 * nous savons reconnaitre — et rien de plus »).
 *
 * ARMEE LE 12 AOUT 2026. Cette sonde-ci n'etait pas seulement indulgente,
 * elle n'attendait RIEN : elle imprimait sept lignes et s'arretait. Aucune
 * valeur attendue, donc rien qui puisse diverger, donc un succes garanti.
 * Elle figurait pourtant dans Controles sous le nom « Les etiquettes en
 * arabe », ce qui se lit comme une garantie.
 *
 * Chaque ligne ci-dessous est desormais une PROMESSE, pas une observation :
 * si le moteur change d'avis sur l'un de ces sept cas, le controle vire au
 * rouge et le code ne part pas en ligne.
 *
 * Le cas qui compte le plus est le troisieme. Une etiquette marocaine porte
 * souvent la gelatine du seul cote arabe : si le moteur ne lit que le cote
 * francais, il rend HALAL un produit qui ne l'est pas. C'est le defaut qui a
 * fait ecrire la liste arabe, et c'est celui-la qu'on gele ici.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
mkdirSync(".test-build", { recursive: true });
writeFileSync(".test-build/halal.mjs", readFileSync("site/halal.js", "utf8"));
const { analyserProduit } = await import(pathToFileURL(".test-build/halal.mjs").href);

// nom, texte d'etiquette, statut attendu, nombre d'alertes attendu
const CAS = [
  ["français seul, avec gélatine", "eau, sucre, gélatine, arôme", "douteux", 1],
  ["bilingue, gélatine côté français", "ماء، سكر، جيلاتين، نكهة / eau, sucre, gélatine, arôme", "douteux", 1],
  ["bilingue, gélatine SEULEMENT en arabe", "ماء، سكر، جيلاتين، نكهة / eau, sucre, arome", "douteux", 1],
  ["arabe seul, contient de la gélatine", "المكونات: ماء، سكر، جيلاتين، نكهة طبيعية", "douteux", 1],
  ["arabe seul, contient du porc", "المكونات: دهن الخنزير، ملح", "haram", 1],
  // Banal, et surtout : le moteur ne doit pas inventer un doute parce que le
  // texte est dans un alphabet qu'il ne lit pas. INCONNU dit la verite —
  // « je n'ai rien reconnu » — la ou DOUTEUX accuserait de l'eau et du sel.
  ["arabe seul, produit banal", "المكونات: ماء، سكر، ملح", "inconnu", 0],
  ["texte vide", "", "inconnu", 0],
];

let ecarts = 0;
for (const [nom, texte, statutAttendu, alertesAttendues] of CAS) {
  const v = analyserProduit({ ingredientsTexte: texte, additifs: [] });
  const ok = v.statut === statutAttendu && v.alertes.length === alertesAttendues;
  if (!ok) ecarts += 1;
  console.log(
    `  ${ok ? "✓" : "✗"} ${nom.padEnd(42)} -> ${v.statut.toUpperCase().padEnd(8)} ${v.alertes.length} alerte(s)` +
      (ok ? "" : `  ← attendu : ${statutAttendu.toUpperCase()} ${alertesAttendues} alerte(s)`)
  );
}

if (ecarts > 0) {
  console.log(`\n✗ ${ecarts} étiquette(s) sur ${CAS.length} ne donnent plus le verdict promis.`);
  process.exit(1);
}
console.log(`\n✓ Les ${CAS.length} étiquettes arabes donnent le verdict attendu.`);
