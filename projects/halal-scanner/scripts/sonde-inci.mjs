// Le moteur cosmetiques n'a jamais ete mesure sur ce qu'il RATE : la sonde
// existante ne verifie que les faux positifs. Noms INCI tels qu'ils figurent
// sur les emballages europeens.
import { analyserCosmetique } from "../site/cosmetiques.js";
const CAS = [
  // deja couverts en principe — controle
  ["Aqua, Sodium Tallowate, Parfum", true],
  ["Aqua, Carmine, Glycerin", true],
  ["Aqua, Hydrolyzed Collagen", true],
  ["AQUA, GELATIN, PARFUM", true],
  // graisses animales sous d'autres noms
  ["Aqua, Tallowamide DEA", true],
  ["Aqua, Tallow Acid", true],
  ["Aqua, Adeps Bovis", true],
  ["Aqua, Adeps Suillus", true],
  ["Aqua, Suet Extract", true],
  ["Aqua, Lard Glyceride", true],
  // derives d'acides gras ecrits autrement
  ["Aqua, Sodium Stearoyl Lactylate", true],
  ["Aqua, Stearoyl Glutamate", true],
  // Volontairement absents des règles : « Cetyl Esters » est aujourd'hui de
  // synthèse dans la quasi-totalité des cas, et le spermaceti (cire de
  // cachalot) ne figure plus sur un emballage européen depuis des décennies.
  // Ajouter une règle pour un ingrédient qui n'apparaît pas, c'est du bruit.
  ["Aqua, Cetyl Esters", false],
  ["Aqua, Spermaceti", false],
  // proteines animales
  ["Aqua, Hydrolyzed Keratin", true],
  ["Aqua, Cysteine HCl", true],
  ["Aqua, Hydrolyzed Silk Protein", true],
  ["Aqua, Placental Protein", true],
  // ecritures d'emballage
  ["AQUA, SODIUM TALLOWATE, PARFUM", true],
  ["Aqua, Gelatine, Parfum", true],
  ["Aqua, Cochineal Extract", true],
  ["Aqua, CI 75470", true],
  // temoins : ne doivent PAS alerter
  ["Aqua, Sodium Chloride, Parfum", false],
  ["Aqua, Cetearyl Alcohol, Parfum", false],
  ["Aqua, Sodium Cocoate, Parfum", false],
  ["Aqua, Tocopherol, Citric Acid", false],
];
let faux = 0;
for (const [texte, attendu] of CAS) {
  const r = analyserCosmetique({ code:"3", nom:"x", ingredientsTexte: texte });
  const alerte = (r.alertes || []).length > 0;
  const ok = alerte === attendu;
  if (!ok) faux++;
  const quoi = (r.alertes || []).map(a => a.libelle || a.element || a.famille).join(", ");
  console.log(`${ok ? "✓" : "✗"} ${texte.padEnd(38)} ${alerte ? "alerte" : "muet  "} ${quoi}`);
}
console.log(`\n${CAS.length - faux}/${CAS.length} conformes, ${faux} ecart(s).`);
if (faux > 0) process.exit(1);
