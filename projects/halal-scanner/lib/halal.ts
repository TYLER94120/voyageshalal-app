// Moteur d'analyse halal de HalalCheck.
// Analyse indicative basée sur les ingrédients et additifs Open Food Facts —
// ne remplace jamais une certification officielle (AVS, ARGML, etc.).

export type StatutVerdict = "halal" | "douteux" | "haram" | "inconnu";

export interface Alerte {
  element: string;
  niveau: "haram" | "douteux";
  raison: string;
  /** Clé de regroupement quand un additif et un mot du texte désignent la même substance. */
  famille?: string;
  /**
   * Gravité du doute, pour ne pas mettre sur le même plan un ingrédient
   * presque toujours végétal aujourd'hui et un ingrédient réellement animal.
   * Absent = traité comme « moderee ».
   */
  gravite?: "faible" | "moderee";
}

export interface Verdict {
  statut: StatutVerdict;
  certifieHalal: boolean;
  vegan: boolean;
  alertes: Alerte[];
}

export interface InfosAdditif {
  niveau: "haram" | "douteux";
  nom: string;
  raison: string;
  famille?: string;
}

// Additifs à risque les plus fréquents (codes sans le préfixe "en:").
export const ADDITIFS_A_RISQUE: Record<string, InfosAdditif> = {
  e120: {
    niveau: "douteux",
    nom: "E120 — Carmin (cochenille)",
    raison: "Colorant extrait d'insectes broyés, considéré non halal par la majorité des avis.",
    famille: "carmin",
  },
  e153: {
    niveau: "douteux",
    nom: "E153 — Charbon",
    raison: "Peut être d'origine végétale ou issu d'os d'animaux.",
  },
  e270: {
    niveau: "douteux",
    nom: "E270 — Acide lactique",
    raison: "Obtenu le plus souvent par fermentation végétale, mais une origine animale reste possible.",
  },
  e322: {
    niveau: "douteux",
    nom: "E322 — Lécithines",
    raison: "Presque toujours de soja ou de tournesol ; une lécithine d'œuf est possible mais rare.",
    famille: "lecithine",
  },
  e325: {
    niveau: "douteux",
    nom: "E325 — Lactate de sodium",
    raison: "Dérivé de l'acide lactique — origine généralement végétale, à confirmer.",
    famille: "lactates",
  },
  e326: {
    niveau: "douteux",
    nom: "E326 — Lactate de potassium",
    raison: "Dérivé de l'acide lactique — origine généralement végétale, à confirmer.",
    famille: "lactates",
  },
  e327: {
    niveau: "douteux",
    nom: "E327 — Lactate de calcium",
    raison: "Dérivé de l'acide lactique — origine généralement végétale, à confirmer.",
    famille: "lactates",
  },
  e422: {
    niveau: "douteux",
    nom: "E422 — Glycérol",
    raison: "Origine végétale ou animale (parfois porcine) non précisée.",
    famille: "glycerol",
  },
  e441: {
    niveau: "haram",
    nom: "E441 — Gélatine",
    raison: "Gélatine le plus souvent porcine. Interdite sauf gélatine certifiée halal.",
    famille: "gelatine",
  },
  e430: { niveau: "douteux", nom: "E430 — Stéarate de polyoxyéthylène", raison: "Dérivé d'acides gras — origine animale possible." },
  e431: { niveau: "douteux", nom: "E431 — Stéarate de polyoxyéthylène", raison: "Dérivé d'acides gras — origine animale possible." },
  e432: { niveau: "douteux", nom: "E432 — Polysorbate 20", raison: "Dérivé d'acides gras — origine animale possible.", famille: "polysorbates" },
  e433: { niveau: "douteux", nom: "E433 — Polysorbate 80", raison: "Dérivé d'acides gras — origine animale possible.", famille: "polysorbates" },
  e434: { niveau: "douteux", nom: "E434 — Polysorbate 40", raison: "Dérivé d'acides gras — origine animale possible.", famille: "polysorbates" },
  e435: { niveau: "douteux", nom: "E435 — Polysorbate 60", raison: "Dérivé d'acides gras — origine animale possible.", famille: "polysorbates" },
  e436: { niveau: "douteux", nom: "E436 — Polysorbate 65", raison: "Dérivé d'acides gras — origine animale possible.", famille: "polysorbates" },
  e442: {
    niveau: "douteux",
    nom: "E442 — Phosphatides d'ammonium",
    raison: "Émulsifiant du chocolat, dérivé de corps gras — origine à confirmer.",
  },
  e470a: {
    niveau: "douteux",
    nom: "E470a — Sels d'acides gras",
    raison: "Sels d'acides gras d'origine végétale ou animale non précisée.",
    famille: "sels-acides-gras",
  },
  e470b: {
    niveau: "douteux",
    nom: "E470b — Sels d'acides gras",
    raison: "Sels d'acides gras d'origine végétale ou animale non précisée.",
    famille: "sels-acides-gras",
  },
  e471: {
    niveau: "douteux",
    nom: "E471 — Mono- et diglycérides",
    raison: "Émulsifiant d'origine végétale ou animale non précisée.",
    famille: "monoglycerides",
  },
  e472a: { niveau: "douteux", nom: "E472a", raison: "Ester d'acides gras — origine animale possible." },
  e472b: { niveau: "douteux", nom: "E472b", raison: "Ester d'acides gras — origine animale possible." },
  e472c: { niveau: "douteux", nom: "E472c", raison: "Ester d'acides gras — origine animale possible." },
  e472d: { niveau: "douteux", nom: "E472d", raison: "Ester d'acides gras — origine animale possible." },
  e472e: { niveau: "douteux", nom: "E472e", raison: "Ester d'acides gras — origine animale possible." },
  e472f: { niveau: "douteux", nom: "E472f", raison: "Ester d'acides gras — origine animale possible." },
  e473: { niveau: "douteux", nom: "E473 — Sucroesters", raison: "Origine animale possible." },
  e474: { niveau: "douteux", nom: "E474 — Sucroglycérides", raison: "Dérivé de corps gras — origine animale possible." },
  e478: { niveau: "douteux", nom: "E478 — Esters lactylés", raison: "Dérivé de corps gras — origine animale possible." },
  e479: { niveau: "douteux", nom: "E479b — Huile de soja oxydée", raison: "Contient des mono/diglycérides — origine à confirmer." },
  e475: { niveau: "douteux", nom: "E475", raison: "Esters polyglycériques — origine animale possible." },
  e476: { niveau: "douteux", nom: "E476 — Polyricinoléate", raison: "Origine animale possible." },
  e477: { niveau: "douteux", nom: "E477", raison: "Esters de propylène glycol — origine animale possible." },
  e481: { niveau: "douteux", nom: "E481", raison: "Stéaroyl-2-lactylate — origine animale possible." },
  e482: { niveau: "douteux", nom: "E482", raison: "Stéaroyl-2-lactylate — origine animale possible." },
  e483: { niveau: "douteux", nom: "E483", raison: "Tartrate de stéaryle — origine animale possible." },
  e484: { niveau: "douteux", nom: "E484 — Citrostéarate de stéaryle", raison: "Dérivé d'acides gras — origine animale possible." },
  e485: { niveau: "douteux", nom: "E485 — Fumarate de stéaryle", raison: "Dérivé d'acides gras — origine animale possible." },
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
    famille: "shellac",
    niveau: "douteux",
    nom: "E904 — Gomme-laque (shellac)",
    raison: "Résine sécrétée par un insecte — avis divergents.",
  },
  e920: {
    niveau: "douteux",
    nom: "E920 — L-cystéine",
    raison: "Parfois extraite de plumes ou de soies animales.",
    famille: "cysteine",
  },
  e921: { niveau: "douteux", nom: "E921 — L-cystine", raison: "Origine animale possible.", famille: "cysteine" },
  e966: {
    niveau: "douteux",
    nom: "E966 — Lactitol",
    raison: "Édulcorant dérivé du lactose (lait) — pas de porc, mais origine à confirmer.",
  },
  e1000: {
    niveau: "haram",
    nom: "E1000 — Acide cholique",
    raison: "Extrait de bile animale (souvent bovine ou porcine). Interdit sauf origine halal certifiée.",
  },
  e1105: {
    niveau: "douteux",
    nom: "E1105 — Lysozyme",
    raison: "Enzyme extraite du blanc d'œuf — licite en soi, mais support et procédé à confirmer.",
  },
};

export interface RegleTexte {
  motif: RegExp;
  element: string;
  raison: string;
  famille?: string;
}

// Les textes sont normalisés (minuscules, sans accents) avant le test.
export const REGLES_HARAM: RegleTexte[] = [
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
    motif: /\bvins?\b|\bbieres?\b|\brhum\b|\bwhisky\b|liqueur|cognac|marsala|calvados|kirsch|grand marnier|\bporto\b|\bsherry\b|\bxeres\b|\bmadere\b|vermouth|\bsake\b|\bcidre\b/,
    element: "Alcool (vin / spiritueux)",
    raison: "Boisson alcoolisée utilisée comme ingrédient.",
  },
];

export const REGLES_DOUTEUX: RegleTexte[] = [
  {
    motif: /gelatine/,
    element: "Gélatine",
    raison: "Origine non précisée — souvent porcine, sauf mention halal.",
    famille: "gelatine",
  },
  {
    motif: /presure|\brennet\b/,
    element: "Présure",
    raison: "Coagulant souvent d'origine animale (fromages) — origine à vérifier.",
  },
  {
    motif: /\bjambon\b|chorizo|pepperoni|salami|mortadelle/,
    element: "Charcuterie",
    raison: "Origine de la viande et abattage à vérifier (souvent porc).",
  },
  {
    motif: /graisses? animales?|gras animal|\bsuif\b|graisses? d'origine animale|\btallow\b|\bshortening\b/,
    element: "Graisse animale",
    raison: "Origine et abattage non vérifiables.",
  },
  {
    motif: /mono[- ]?et diglycerides|monoglycerides|diglycerides/,
    element: "Mono/diglycérides",
    raison: "Émulsifiant d'origine possiblement animale.",
    famille: "monoglycerides",
  },
  {
    motif: /\bcarmins?\b|\bcarmine\b|cochenille|carminic/,
    element: "Carmin (cochenille)",
    raison: "Colorant issu d'insectes — majoritairement considéré non halal.",
    famille: "carmin",
  },
  {
    motif: /\bpepsine\b|\bpancreatine\b|\blipases?\b|\btrypsine\b/,
    element: "Enzyme d'origine possiblement animale",
    raison:
      "Pepsine, pancréatine et lipase sont souvent extraites d'estomac ou de pancréas ; il en existe aussi des versions microbiennes. L'étiquette ne le précise pas.",
    famille: "enzymes-animales",
  },
  {
    motif: /gomme[- ]laque|\bshellac\b/,
    element: "Gomme laque (shellac)",
    raison: "Résine sécrétée par un insecte, utilisée pour lustrer. Même substance que l'additif E904.",
    famille: "shellac",
  },
  {
    motif: /\bcollagene\b|\belastine\b/,
    element: "Collagène / élastine",
    raison: "Protéines extraites de peau, d'os ou de tissus animaux — espèce et abattage non précisés.",
    famille: "collagene",
  },
  {
    motif: /\bglycerines?\b/,
    element: "Glycérine",
    raison: "Origine végétale ou animale (parfois porcine) non précisée. Même substance que l'additif E422.",
    famille: "glycerol",
  },
  {
    motif: /l[- ]?cysteine/,
    element: "L-cystéine",
    raison: "Parfois extraite de plumes ou de soies animales.",
    famille: "cysteine",
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
  // Origine explicitement annoncee : le doute n'a plus lieu d'etre.
  // Le texte de remplacement ne doit surtout pas contenir « glycerine », sinon
  // la regle qui suit le retrouve et le garde-fou ne sert a rien.
  t = t.replace(/glycerines? vegetales?|glycerols? vegetals?|glycerine d'origine vegetale/g, " corps gras vegetal ");
  t = t.replace(/lipase microbienne|enzyme microbienne|presure microbienne/g, " enzyme microbienne ");
  return t;
}

/**
 * Le texte est-il rédigé dans une langue que nos règles savent lire ?
 *
 * Nos motifs sont français et anglais. Une étiquette écrite uniquement en
 * arabe ne déclenche donc rien — et sans ce garde-fou, « aucune alerte »
 * devenait « halal ». Mesuré le 10 août : une composition arabe disant
 * « graisse de porc » (دهن الخنزير) ressortait HALAL. C'est le pire verdict
 * possible, sur exactement le public visé par ce produit.
 *
 * Le seuil de 12 lettres latines est celui déjà utilisé à l'affichage pour
 * décider si l'on peut retirer l'arabe d'une étiquette bilingue.
 */
function texteAnalysable(texte: string): boolean {
  return (texte.match(/[a-zà-öø-ÿ]/gi) || []).length >= 12;
}

/**
 * Récupère les codes E écrits en toutes lettres dans la composition.
 *
 * Pourquoi c'est indispensable : les codes ne nous arrivent normalement que par
 * le champ `additives_tags` d'Open Food Facts. Or il est souvent vide sur les
 * produits du Maghreb et des épiceries — précisément notre public — et il
 * n'existe pas du tout quand l'étiquette est lue en photo : on n'a alors que du
 * texte. Sans cette lecture, « émulsifiant E471 » ressortait **halal**.
 *
 * Le garde-fou « vitamine » n'est pas décoratif : « Vitamine E 400 UI » se lit
 * sinon comme l'additif E400.
 */
function codesEDuTexte(texte: string): string[] {
  const trouves = new Set<string>();
  const motif = /\be\s?(\d{3,4})\s?([a-z])?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = motif.exec(texte)) !== null) {
    const avant = texte.slice(Math.max(0, m.index - 10), m.index);
    if (/vitamine\s*$/i.test(avant)) continue;
    trouves.add("e" + m[1] + (m[2] ? m[2].toLowerCase() : ""));
  }
  return [...trouves];
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

  const texte = normaliser(entree.ingredientsTexte ?? "");

  // Les codes déclarés par la base ET ceux écrits dans la composition. Le
  // dédoublonnage par famille, plus bas, empêche la double alerte quand les
  // deux sources désignent la même substance.
  const codes = [...(entree.additifs ?? []), ...codesEDuTexte(texte)];

  for (const tag of codes) {
    const code = tag.replace(/^[a-z]{2,3}:/i, "").toLowerCase();
    const infos = ADDITIFS_A_RISQUE[code];
    if (infos) {
      alertes.push({
        element: infos.nom,
        niveau: infos.niveau,
        raison: infos.raison,
        famille: infos.famille,
      });
    }
  }

  if (texte.trim().length > 0) {
    for (const regle of [...REGLES_HARAM.map((r) => ({ ...r, niveau: "haram" as const })), ...REGLES_DOUTEUX.map((r) => ({ ...r, niveau: "douteux" as const }))]) {
      if (regle.motif.test(texte)) {
        alertes.push({
          element: regle.element,
          niveau: regle.niveau,
          raison: regle.raison,
          famille: regle.famille,
        });
      }
    }
  }

  // Dédoublonnage : un additif et un mot du texte peuvent désigner la même substance
  // (ex : E441 + "gélatine"). On regroupe par famille et on garde la plus sévère.
  const parCle = new Map<string, Alerte>();
  for (const a of alertes) {
    const cle = (a.famille ?? a.element).toLowerCase();
    const existante = parCle.get(cle);
    if (!existante) {
      parCle.set(cle, a);
    } else if (a.niveau === "haram" && existante.niveau !== "haram") {
      parCle.set(cle, a);
    }
  }
  const alertesUniques = [...parCle.values()];

  const aHaram = alertesUniques.some((a) => a.niveau === "haram");
  const aDouteux = alertesUniques.some((a) => a.niveau === "douteux");
  // On ne peut conclure « halal » que sur ce qu'on a réellement su lire :
  // un texte analysable, ou des codes additifs fournis par la base.
  const brut = entree.ingredientsTexte ?? "";
  const aDesDonnees =
    texteAnalysable(brut) || codes.length > 0 || (entree.additifs ?? []).length > 0;

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
    // Couvre les deux cas : aucune donnée, et une étiquette illisible pour nous.
    // Dans les deux, « inconnu » est la seule réponse honnête.
    statut = "inconnu";
  }

  return { statut, certifieHalal, vegan, alertes: alertesUniques };
}
