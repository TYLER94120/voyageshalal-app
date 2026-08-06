// Moteur d'analyse halal de HalalCheck.
// Analyse indicative basée sur les ingrédients et additifs Open Food Facts —
// ne remplace jamais une certification officielle (AVS, ARGML, etc.).

export type StatutVerdict = "halal" | "douteux" | "haram" | "inconnu";

export interface Alerte {
  element: string;
  niveau: "haram" | "douteux";
  raison: string;
}

export interface Verdict {
  statut: StatutVerdict;
  certifieHalal: boolean;
  vegan: boolean;
  alertes: Alerte[];
}

interface InfosAdditif {
  niveau: "haram" | "douteux";
  nom: string;
  raison: string;
}

// Additifs à risque les plus fréquents (codes sans le préfixe "en:").
const ADDITIFS_A_RISQUE: Record<string, InfosAdditif> = {
  e120: {
    niveau: "douteux",
    nom: "E120 — Carmin (cochenille)",
    raison: "Colorant extrait d'insectes broyés, considéré non halal par la majorité des avis.",
  },
  e153: {
    niveau: "douteux",
    nom: "E153 — Charbon",
    raison: "Peut être d'origine végétale ou issu d'os d'animaux.",
  },
  e422: {
    niveau: "douteux",
    nom: "E422 — Glycérol",
    raison: "Origine végétale ou animale (parfois porcine) non précisée.",
  },
  e441: {
    niveau: "haram",
    nom: "E441 — Gélatine",
    raison: "Gélatine le plus souvent porcine. Interdite sauf gélatine certifiée halal.",
  },
  e471: {
    niveau: "douteux",
    nom: "E471 — Mono- et diglycérides",
    raison: "Émulsifiant d'origine végétale ou animale non précisée.",
  },
  e472a: { niveau: "douteux", nom: "E472a", raison: "Ester d'acides gras — origine animale possible." },
  e472b: { niveau: "douteux", nom: "E472b", raison: "Ester d'acides gras — origine animale possible." },
  e472c: { niveau: "douteux", nom: "E472c", raison: "Ester d'acides gras — origine animale possible." },
  e472d: { niveau: "douteux", nom: "E472d", raison: "Ester d'acides gras — origine animale possible." },
  e472e: { niveau: "douteux", nom: "E472e", raison: "Ester d'acides gras — origine animale possible." },
  e472f: { niveau: "douteux", nom: "E472f", raison: "Ester d'acides gras — origine animale possible." },
  e473: { niveau: "douteux", nom: "E473 — Sucroesters", raison: "Origine animale possible." },
  e475: { niveau: "douteux", nom: "E475", raison: "Esters polyglycériques — origine animale possible." },
  e476: { niveau: "douteux", nom: "E476 — Polyricinoléate", raison: "Origine animale possible." },
  e477: { niveau: "douteux", nom: "E477", raison: "Esters de propylène glycol — origine animale possible." },
  e481: { niveau: "douteux", nom: "E481", raison: "Stéaroyl-2-lactylate — origine animale possible." },
  e482: { niveau: "douteux", nom: "E482", raison: "Stéaroyl-2-lactylate — origine animale possible." },
  e483: { niveau: "douteux", nom: "E483", raison: "Tartrate de stéaryle — origine animale possible." },
  e491: { niveau: "douteux", nom: "E491 — Sorbitane", raison: "Origine animale possible." },
  e492: { niveau: "douteux", nom: "E492 — Sorbitane", raison: "Origine animale possible." },
  e493: { niveau: "douteux", nom: "E493 — Sorbitane", raison: "Origine animale possible." },
  e494: { niveau: "douteux", nom: "E494 — Sorbitane", raison: "Origine animale possible." },
  e495: { niveau: "douteux", nom: "E495 — Sorbitane", raison: "Origine animale possible." },
  e542: {
    niveau: "douteux",
    nom: "E542 — Phosphate d'os",
    raison: "Issu d'os d'animaux — abattage non vérifiable.",
  },
  e570: { niveau: "douteux", nom: "E570 — Acides gras", raison: "Origine animale possible." },
  e572: { niveau: "douteux", nom: "E572 — Stéarate de magnésium", raison: "Origine animale possible." },
  e627: { niveau: "douteux", nom: "E627 — Guanylate", raison: "Exhausteur — origine animale possible." },
  e631: { niveau: "douteux", nom: "E631 — Inosinate", raison: "Exhausteur parfois issu de viande ou de poisson." },
  e635: { niveau: "douteux", nom: "E635 — Ribonucléotides", raison: "Exhausteur — origine animale possible." },
  e640: { niveau: "douteux", nom: "E640 — Glycine", raison: "Origine animale possible." },
  e904: {
    niveau: "douteux",
    nom: "E904 — Gomme-laque (shellac)",
    raison: "Résine sécrétée par un insecte — avis divergents.",
  },
  e920: {
    niveau: "douteux",
    nom: "E920 — L-cystéine",
    raison: "Parfois extraite de plumes ou de soies animales.",
  },
  e921: { niveau: "douteux", nom: "E921 — L-cystine", raison: "Origine animale possible." },
};

interface RegleTexte {
  motif: RegExp;
  element: string;
  raison: string;
}

// Les textes sont normalisés (minuscules, sans accents) avant le test.
const REGLES_HARAM: RegleTexte[] = [
  {
    motif: /\bporcs?\b|porcine?s?\b|\blard\b|saindoux|couenne|\bbacon\b|poitrine fumee/,
    element: "Porc / dérivé de porc",
    raison: "Le porc et tous ses dérivés sont interdits.",
  },
  {
    motif: /\balcools?\b|\bethanol\b/,
    element: "Alcool",
    raison: "Présence d'alcool dans la composition.",
  },
  {
    motif: /\bvins?\b|\bbieres?\b|\brhum\b|\bwhisky\b|liqueur|cognac|marsala|calvados|kirsch|grand marnier/,
    element: "Alcool (vin / spiritueux)",
    raison: "Boisson alcoolisée utilisée comme ingrédient.",
  },
];

const REGLES_DOUTEUX: RegleTexte[] = [
  {
    motif: /gelatine/,
    element: "Gélatine",
    raison: "Origine non précisée — souvent porcine, sauf mention halal.",
  },
  {
    motif: /presure/,
    element: "Présure",
    raison: "Coagulant souvent d'origine animale (fromages) — origine à vérifier.",
  },
  {
    motif: /\bjambon\b|chorizo|pepperoni|salami|mortadelle/,
    element: "Charcuterie",
    raison: "Origine de la viande et abattage à vérifier (souvent porc).",
  },
  {
    motif: /graisses? animales?|gras animal|\bsuif\b|graisses? d'origine animale/,
    element: "Graisse animale",
    raison: "Origine et abattage non vérifiables.",
  },
  {
    motif: /mono[- ]?et diglycerides|monoglycerides|diglycerides/,
    element: "Mono/diglycérides",
    raison: "Émulsifiant d'origine possiblement animale.",
  },
  {
    motif: /\bcarmin\b|cochenille/,
    element: "Carmin (cochenille)",
    raison: "Colorant issu d'insectes — majoritairement considéré non halal.",
  },
  {
    motif: /l[- ]?cysteine/,
    element: "L-cystéine",
    raison: "Parfois extraite de plumes ou de soies animales.",
  },
  {
    motif: /arome de viande|bouillon de (poulet|bœuf|boeuf|viande|volaille)|fond de (veau|volaille)/,
    element: "Arôme / bouillon de viande",
    raison: "Origine de la viande et abattage à vérifier.",
  },
  {
    motif: /\bviandes?\b|\bpoulets?\b|\bboeuf\b|\bbœuf\b|\bagneau\b|\bdindes?\b|\bvolailles?\b|\bcanard\b|\bveau\b|\bmouton\b/,
    element: "Viande",
    raison: "Viande détectée — abattage halal à vérifier, sauf certification.",
  },
];

function normaliser(texte: string): string {
  let t = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // Faux positifs connus : on neutralise avant l'analyse.
  t = t.replace(/vinaigre de vin/g, "vinaigre");
  t = t.replace(/sans alcool/g, "");
  t = t.replace(/sans porc/g, "");
  return t;
}

export function analyserProduit(entree: {
  ingredientsTexte?: string | null;
  additifs?: string[] | null;
  labels?: string[] | null;
}): Verdict {
  const labels = (entree.labels ?? []).map((l) => l.toLowerCase());
  const certifieHalal = labels.some((l) => l.includes("halal"));
  const vegan = labels.some((l) => l.includes("vegan") || l.includes("vegetalien"));

  const alertes: Alerte[] = [];

  for (const tag of entree.additifs ?? []) {
    const code = tag.replace(/^[a-z]{2,3}:/i, "").toLowerCase();
    const infos = ADDITIFS_A_RISQUE[code];
    if (infos) {
      alertes.push({ element: infos.nom, niveau: infos.niveau, raison: infos.raison });
    }
  }

  const texte = normaliser(entree.ingredientsTexte ?? "");
  if (texte.trim().length > 0) {
    for (const regle of [...REGLES_HARAM.map((r) => ({ ...r, niveau: "haram" as const })), ...REGLES_DOUTEUX.map((r) => ({ ...r, niveau: "douteux" as const }))]) {
      if (regle.motif.test(texte)) {
        alertes.push({ element: regle.element, niveau: regle.niveau, raison: regle.raison });
      }
    }
  }

  // Dédoublonnage par élément (un additif peut aussi apparaître dans le texte).
  const vues = new Set<string>();
  const alertesUniques = alertes.filter((a) => {
    const cle = a.element.toLowerCase();
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });

  const aHaram = alertesUniques.some((a) => a.niveau === "haram");
  const aDouteux = alertesUniques.some((a) => a.niveau === "douteux");
  const aDesDonnees = texte.trim().length >= 3 || (entree.additifs ?? []).length > 0;

  let statut: StatutVerdict;
  if (certifieHalal && !aHaram) {
    statut = "halal";
  } else if (aHaram) {
    statut = "haram";
  } else if (vegan) {
    // Végane sans alcool détecté : les doutes d'origine animale tombent.
    statut = "halal";
  } else if (aDouteux) {
    statut = "douteux";
  } else if (aDesDonnees) {
    statut = "halal";
  } else {
    statut = "inconnu";
  }

  return { statut, certifieHalal, vegan, alertes: alertesUniques };
}
