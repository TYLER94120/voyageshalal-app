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
    // Aligné sur la règle texte « gélatine » : la même substance rendait
    // DOUTEUX écrite en toutes lettres et HARAM sous son code. Une gélatine
    // sans origine précisée peut être bovine ; dire « interdit » serait un
    // verdict que l'étiquette ne permet pas. Le doute se dit DOUTEUX.
    niveau: "douteux",
    nom: "E441 — Gélatine",
    raison: "Origine non précisée — souvent porcine, sauf mention halal certifiée.",
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
/**
 * Les mots arabes que nous savons reconnaitre — et rien de plus.
 *
 * Ce n'est PAS de la comprehension de l'arabe : c'est une liste courte de
 * mentions dont le sens ne se discute pas et qui figurent telles quelles sur
 * les emballages du Maghreb. Mesure du 10 aout : une etiquette bilingue dont
 * seul le cote arabe portait l'ingredient a risque ressortait « halal ».
 *
 * Pourquoi une simple sous-chaine suffit : l'arabe n'a pas de majuscules, et
 * les prefixes se collent au mot sans le modifier — « الخنزير » (le porc)
 * contient « خنزير ».
 *
 * On n'ajoute ici que ce dont on est sur. « شحم » (graisse) ou « دهن » (gras)
 * sont trop generiques et resteraient dehors : ils seraient vegetaux neuf fois
 * sur dix, et un faux « douteux » use la confiance autant qu'un oubli.
 */
export const REGLES_HARAM: RegleTexte[] = [
  {
    motif: /خنزير/,
    element: "Porc (خنزير)",
    raison: "Le mot « porc » figure en arabe sur l'étiquette. Le porc et tous ses dérivés sont interdits.",
    famille: "porc",
  },
  {
    motif: /كحول|خمر/,
    element: "Alcool (كحول)",
    raison: "Le mot « alcool » ou « vin » figure en arabe sur l'étiquette.",
    famille: "alcool",
  },
  {
    // « lardons » n'etait pas attrape : \blard\b s'arrete au mot exact, et
    // « lardons » figure sur des centaines d'etiquettes francaises (quiches,
    // salades, plats cuisines). Mesure du 11 aout : le produit ressortait HALAL.
    // Le \b initial protege « milliard », « lardacé » n'existe pas en cuisine.
    motif: /\bporcs?\b|porcine?s?\b|\blard\b|\blardons?\b|saindoux|couenne|\bbacon\b|poitrine fumee|petit sale/,
    element: "Porc / dérivé de porc",
    raison: "Le porc et tous ses dérivés sont interdits.",
  },
  {
    motif: /\balcools?\b|\bethanol\b/,
    element: "Alcool",
    raison: "Présence d'alcool dans la composition.",
  },
  {
    motif: /\bvins?\b|\bbieres?\b|\brhums?\b|\bwhisk(?:y|ys|ies)\b|liqueurs?|cognacs?|marsala|calvados|kirsch|grand marnier|\bportos?\b|\bsherry\b|\bxeres\b|\bmadere\b|vermouths?|\bsake\b|\bcidres?\b/,
    element: "Alcool (vin / spiritueux)",
    raison: "Boisson alcoolisée utilisée comme ingrédient.",
  },
];

export const REGLES_DOUTEUX: RegleTexte[] = [
  {
    motif: /جيلاتين|جلاتين/,
    element: "Gélatine (جيلاتين)",
    raison: "Le mot « gélatine » figure en arabe sur l'étiquette. Origine non précisée — souvent porcine, sauf mention halal.",
    famille: "gelatine",
  },
  {
    motif: /انفحة|إنفحة/,
    element: "Présure (إنفحة)",
    raison: "Le mot « présure » figure en arabe sur l'étiquette. Coagulant souvent d'origine animale.",
    famille: "presure",
  },
  {
    motif: /لحم/,
    element: "Viande (لحم)",
    raison: "Le mot « viande » figure en arabe sur l'étiquette. Abattage halal à vérifier, sauf certification.",
    famille: "viande",
  },
  {
    motif: /gelatine/,
    element: "Gélatine",
    raison: "Origine non précisée — souvent porcine, sauf mention halal.",
    famille: "gelatine",
  },
  {
    // Le code E920 etait repere, le mot ecrit en toutes lettres non — or les
    // etiquettes francaises ecrivent souvent « L-cysteine » sans le numero.
    motif: /\bl-?cysteines?\b|\bcysteines?\b/,
    element: "L-cystéine",
    raison: "Améliorant de panification, parfois extrait de plumes ou de soies animales.",
    famille: "cysteine",
  },
  {
    // Meme substance que E570 et E572, deja surveilles par leur code seul.
    motif: /acides? stearique|\bstearates?\b|stearate de magnesium|acides? gras animaux/,
    element: "Acide stéarique / stéarate",
    raison: "Corps gras d'origine végétale ou animale non précisée.",
    famille: "acides-gras",
  },
  {
    motif: /boyaux? naturels?|\bboyaux?\b/,
    element: "Boyau naturel",
    raison: "Enveloppe des saucisses : intestin animal, souvent porcin. Origine à vérifier.",
    famille: "boyau",
  },
  {
    motif: /presure|\brennet\b/,
    element: "Présure",
    raison: "Coagulant souvent d'origine animale (fromages) — origine à vérifier.",
  },
  {
    motif: /\bjambons?\b|chorizos?|pepperonis?|salamis?|mortadelles?/,
    element: "Charcuterie",
    raison: "Origine de la viande et abattage à vérifier (souvent porc).",
  },
  {
    motif: /graisses? animales?|gras animal|\bsuifs?\b|graisses? d'origine animale|\btallow\b|\bshortening\b/,
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
    motif: /\bcollagenes?\b|\belastines?\b/,
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
    motif: /\bviandes?\b|\bpoulets?\b|\bboeufs?\b|\bbœufs?\b|\bagneaux?\b|\bdindes?\b|\bvolailles?\b|\bcanards?\b|\bveaux?\b|\bmoutons?\b/,
    element: "Viande",
    raison: "Viande détectée — abattage halal à vérifier, sauf certification.",
  },
];

function normaliser(texte: string): string {
  let t = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Harakat arabes : rares sur les emballages, mais elles casseraient la
    // comparaison quand elles sont la.
    .replace(/[\u064B-\u0652\u0670]/g, "");
  // Faux positifs connus : on neutralise avant l'analyse.
  t = t.replace(/vinaigre de vin/g, "vinaigre");
  t = t.replace(/sans alcool/g, "");
  t = t.replace(/sans porc/g, "");
  // Origine explicitement annoncee : le doute n'a plus lieu d'etre.
  // Le texte de remplacement ne doit surtout pas contenir « glycerine », sinon
  // la regle qui suit le retrouve et le garde-fou ne sert a rien.
  t = t.replace(/glycerines? vegetales?|glycerols? vegetals?|glycerine d'origine vegetale/g, " corps gras vegetal ");
  t = t.replace(/lipase microbienne|enzyme microbienne|presure microbienne/g, " enzyme microbienne ");
  // Suite du meme principe, ajoutee le 13 aout — meme famille de defaut que
  // l'eau de source photographiee par Mohamed : un exces de doute sur un
  // produit ordinaire, alors que l'etiquette REPOND deja a la question.
  //
  // « E471 d'origine vegetale » etait deja neutralise ; la forme ecrite en
  // toutes lettres, elle, ressortait DOUTEUX. Or les deux se lisent sur les
  // memes paquets, en France. Idem pour les stearates des complements
  // alimentaires. Douter d'une etiquette qui precise « vegetale » punit
  // exactement les fabricants qui ont fait l'effort de le dire.
  t = t.replace(
    /(?:mono-? et diglycerides|mono-?diglycerides|stearates? de magnesium|stearates? de calcium|acides? stearique|acides? gras)(?:(?!anim)[^,;.])*?(?:d'origine\s+)?vegetale?s?/g,
    " corps gras vegetal "
  );
  // La gelatine de POISSON est l'alternative halal la plus courante, et les
  // fabricants l'ecrivent justement pour le signaler. La signaler douteuse
  // decourage le produit meme qu'on cherche.
  // Le mot de remplacement ne doit PAS contenir « gelatine » : la regle
  // texte est une simple sous-chaine, elle le retrouverait aussitot. Meme
  // piege que pour la glycerine vegetale, signale plus haut.
  t = t.replace(/gelatines? (?:de )?(?:poisson|marine)s?|fish gelatin\w*/g, " gelifiant de poisson ");
  // Et quand la composition dit elle-meme « halal » a cote de la gelatine, le
  // doute que notre regle annonce — « sauf mention halal certifiee » — est
  // leve par l'etiquette. Portee volontairement etroite : la mention doit
  // toucher la gelatine, pas trainer n'importe ou dans le texte.
  t = t.replace(/gelatines?(?: de)? (?:boeuf|bovine|bovin|veau)?\s*(?:certifiee?\s*)?halal/g, " gelifiant certifie ");
  // « levure de bière » est une levure séchée, sans une goutte d'alcool : le mot
  // « bière » n'y désigne que son origine industrielle. Mesuré le 11 août, le
  // moteur rendait HARAM — un interdit inventé chasse les gens d'un aliment
  // permis, et abîme la confiance autant qu'un « halal » faux.
  t = t.replace(/levures? de bieres?/g, " levure sechee ");
  // Même décision que « vinaigre de vin », déjà neutralisé plus haut : le
  // vinaigre d'alcool est le vinaigre blanc des moutardes et des cornichons.
  // Laisser l'un passer et déclarer l'autre interdit était incohérent.
  t = t.replace(/vinaigres? d'alcool|vinaigres? blancs?/g, " vinaigre ");
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
 *
 * DEUXIÈME GARDE-FOU, 12 août 2026 : compter les lettres ne suffisait pas.
 * Une phrase qui dit « on ne sait pas » est faite de lettres, et passait donc
 * pour une composition lisible. Mesuré sur 28 formulations : **16 rendaient
 * HALAL sans la moindre preuve**, dont « non renseigné » (12 lettres, pile le
 * seuil), « information non disponible », « voir l'emballage », « see
 * packaging », « ingrédients non disponibles ».
 *
 * C'est le pire défaut possible pour ce produit : un verdict inventé à partir
 * d'une absence de données. Une charcuterie dont la base ne connaît pas la
 * composition ressortait verte. Les rares qui échappaient — « à compléter »,
 * « unknown » — n'échappaient que par leur longueur : « azertyuiop » sortait
 * INCONNU à 10 lettres et serait passé HALAL à 12.
 *
 * On retire ces mentions AVANT de compter. Retirer plutôt que rejeter en bloc
 * évite l'excès inverse : « Sucre, cacao. Voir emballage pour les allergènes »
 * garde 25 lettres utiles et reste une vraie composition.
 */
const MENTIONS_ABSENCE =
  /non renseign\w*|non sp[ée]cifi\w*|non communiqu\w*|informations? non disponibles?|non disponibles?|pas d'informations?|aucune information|liste non disponible|ingr[ée]dients? non disponibles?|[àa] compl[ée]ter|[àa] renseigner|voir (?:sur )?(?:l'|le )?emballage|see (?:the )?packaging|not available|no information|unknown/gi;

/**
 * TROISIÈME VERSION, 13 août 2026 — et cette fois le seuil lui-même était
 * l'erreur.
 *
 * Mohame a photographié une bouteille d'eau Cristaline : composition
 * « Eau de source », verdict **INCONNU**. Onze lettres, seuil à douze.
 *
 * Mesuré sur 19 compositions réelles et complètes : **16 ressortaient
 * INCONNU** — eau, riz, sel, sucre, miel, farine de blé, thé vert, café,
 * pois chiches, semoule, huile d'olive, lait entier. Ce sont des produits de
 * base, et précisément ceux d'une cuisine maghrébine. Répondre « je ne sais
 * pas » devant une bouteille d'eau ne protège personne : ça donne l'app pour
 * cassée, et on cesse de la croire quand elle dit vraiment quelque chose.
 *
 * Compter les lettres n'a jamais été la bonne question. La vraie question est
 * **avons-nous eu une chance de lire ?** Une étiquette en arabe seul : non,
 * nos motifs sont latins. « Eau de source » : oui, parfaitement — nous avons
 * lu, et nous n'avons rien trouvé à signaler. Ce n'est pas la même chose.
 *
 * D'où le critère : au moins un MOT latin de trois lettres. « Eau » passe,
 * « ab » non, une composition en arabe seul non.
 *
 * Ce que ça accepte sciemment : un texte latin sans queue ni tête de trois
 * lettres ou plus ressortira HALAL. Le risque existe, il est assumé, et il se
 * compare à ce qu'on remplace — seize produits de base sur dix-neuf déclarés
 * illisibles, tous les jours, sous les yeux des gens.
 */
function texteAnalysable(texte: string): boolean {
  const sansMentions = texte.replace(MENTIONS_ABSENCE, " ");
  return /[a-zà-öø-ÿ]{3,}/i.test(sansMentions);
}

/**
 * « Peut contenir des traces de porc » n'est pas « contient du porc ».
 *
 * Mesuré le 13 août : « biscuit, sucre. Peut contenir des traces de porc. »
 * ressortait **HARAM** — le même verdict qu'un pâté de campagne. Idem pour
 * « Fabriqué dans un atelier qui utilise du porc ».
 *
 * Deux raisons de refuser ce verdict-là :
 *
 *  · **Il est faux sur la composition.** Le produit ne contient pas de porc ;
 *    le fabricant avertit d'une contamination accidentelle possible. Dire
 *    « interdit » décrit un produit qui n'existe pas.
 *
 *  · **Il tranche une question qui ne m'appartient pas.** Les traces
 *    accidentelles relèvent d'un désaccord entre écoles, comme « arôme
 *    naturel ». Un HARAM inventé chasse quelqu'un d'un aliment permis, et
 *    abîme la confiance autant qu'un HALAL faux.
 *
 * La clause est donc séparée de la composition : ce qu'on y trouve devient un
 * DOUTEUX de gravité faible, avec une explication qui dit exactement ce qui a
 * été lu. Se taire serait l'autre faute — la personne a le droit de savoir.
 *
 * La portée est étroite : un ingrédient trouvé dans la composition garde son
 * niveau. « Graisse de porc » + « traces de lait » reste HARAM.
 */
const DEBUT_DES_TRACES =
  /(?:peut contenir|peuvent contenir|traces? eventuelles?|traces? possibles?|traces? de|fabrique dans un (?:atelier|etablissement)|susceptible de contenir|presence possible)/;

function separerLesTraces(texte: string): { composition: string; traces: string } {
  const m = texte.match(DEBUT_DES_TRACES);
  if (!m || m.index === undefined) return { composition: texte, traces: "" };
  let traces = texte.slice(m.index);
  let composition = texte.slice(0, m.index);
  // La clause de traces se termine si la composition REPREND derrière. Les
  // bases sont remplies par des contributeurs : l'ordre habituel est
  // ingrédients puis traces, mais l'inverse arrive. Sans ce retour en
  // arrière, « Peut contenir des traces de lait. Ingrédients : graisse de
  // porc » aurait traité la graisse de porc comme une trace — un faux négatif
  // fabriqué par le garde-fou lui-même.
  const reprise = traces.slice(m[0].length).match(/ingredients?\s*:?/);
  if (reprise && reprise.index !== undefined) {
    const coupe = m[0].length + reprise.index;
    composition += " " + traces.slice(coupe);
    traces = traces.slice(0, coupe);
  }
  return { composition, traces };
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

/**
 * Une étiquette qui NIE — et le piège qu'elle tendait.
 *
 * Mesuré le 12 août 2026 : `certifieHalal` était un simple
 * `label.includes("halal")`. Or « en:non-halal » contient « halal ». Huit
 * étiquettes qui nient explicitement le halal étaient donc lues comme une
 * certification, et une composition à la gélatine ressortait **HALAL, certifié
 * ✓** : en:non-halal, en:not-halal, fr:non-halal, en:halal-not-certified,
 * en:no-halal-certification, fr:sans-certification-halal — plus en:non-vegan
 * et fr:non-vegetalien, qui activaient le raccourci végane.
 *
 * C'est l'inversion la plus grave possible : le produit affirmait le contraire
 * de ce que la base disait. Même famille de défaut que « lardons » attrapé par
 * `\blard\b` — une sous-chaîne qui ne regarde pas le mot autour.
 *
 * Les étiquettes d'Open Food Facts sont libres et écrites par des
 * contributeurs. Le doute penche donc toujours du même côté : en cas
 * d'ambiguïté on NE certifie PAS. Une certification manquée affiche DOUTEUX
 * avec une explication ; une certification inventée fait manger du porc.
 */
const NEGATION = /(^|[-_\s:])(non|not|no|sans|without)([-_\s]|$)/;

function nie(label: string): boolean {
  return NEGATION.test(label);
}

function affirme(label: string, motif: RegExp): boolean {
  return motif.test(label) && !nie(label);
}

export function analyserProduit(entree: {
  ingredientsTexte?: string | null;
  additifs?: string[] | null;
  labels?: string[] | null;
}): Verdict {
  const labels = (entree.labels ?? []).map((l) => l.toLowerCase());
  const certifieHalal = labels.some((l) => affirme(l, /halal/));
  const vegan = labels.some((l) => affirme(l, /vegan|vegetalien/));
  // Une étiquette qui NIE le halal ne doit pas passer sous silence.
  const declareNonHalal = labels.some((l) => nie(l) && /halal/.test(l));

  const alertes: Alerte[] = [];

  if (declareNonHalal && !certifieHalal) {
    alertes.push({
      element: "Étiquette « non halal »",
      niveau: "douteux",
      raison:
        "La base indique que ce produit n'est PAS halal. Cette information vient de contributeurs, pas d'un organisme : à vérifier sur l'emballage.",
      famille: "label-non-halal",
    });
  }

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
    const { composition, traces } = separerLesTraces(texte);
    for (const regle of [...REGLES_HARAM.map((r) => ({ ...r, niveau: "haram" as const })), ...REGLES_DOUTEUX.map((r) => ({ ...r, niveau: "douteux" as const }))]) {
      if (regle.motif.test(composition)) {
        alertes.push({
          element: regle.element,
          niveau: regle.niveau,
          raison: regle.raison,
          famille: regle.famille,
        });
      } else if (traces && regle.motif.test(traces)) {
        // Trouvé UNIQUEMENT dans la clause de traces : ce n'est pas un
        // ingrédient. On le dit, sans trancher à la place de la personne.
        alertes.push({
          element: "Traces possibles — " + regle.element,
          niveau: "douteux",
          raison:
            "L'étiquette signale des traces possibles, pas un ingrédient : le produit n'en contient pas. " +
            "Les avis divergent sur les traces accidentelles — à toi de décider selon ton école.",
          famille: regle.famille,
          gravite: "faible",
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
  // On ne peut conclure « halal » que sur ce qu'on a réellement su lire :
  // un texte analysable, ou des codes additifs fournis par la base.
  const brut = entree.ingredientsTexte ?? "";
  const aDesDonnees =
    texteAnalysable(brut) || codes.length > 0 || (entree.additifs ?? []).length > 0;

  // Une étiquette « végane » vient de contributeurs, pas d'un organisme. Elle ne
  // peut donc répondre qu'aux doutes dont « végétale » est une issue possible —
  // ceux qui le disent eux-mêmes : « origine végétale OU animale non précisée »
  // (E471, stéarates, glycérine). Elle ne répond pas au carmin, extrait
  // d'insectes par définition ; pas à la gélatine, dont la seule issue nommée
  // est une mention halal ; pas à une étiquette « non halal », qui ne parle pas
  // d'origine du tout.
  //
  // Mesuré le 13 août : « non halal » + « végane » ressortait HALAL, en
  // affichant « Étiquette non halal » juste en dessous. Idem végane + gélatine,
  // et végane + carmin. Deux données qui se contredisent font un doute, jamais
  // un feu vert — sinon il suffit d'une étiquette végane de contributeur pour
  // effacer tout ce que la composition dit.
  const leveParLeVegan = (a: Alerte) =>
    a.niveau === "douteux" &&
    a.famille !== "label-non-halal" &&
    /origine v[ée]g[ée]tale ou animale/i.test(a.raison);
  const doutesRestants = alertesUniques.filter(
    (a) => a.niveau === "douteux" && !(vegan && leveParLeVegan(a)),
  );

  let statut: StatutVerdict;
  if (certifieHalal && !aHaram) {
    statut = "halal";
  } else if (aHaram) {
    statut = "haram";
  } else if (doutesRestants.length > 0) {
    statut = "douteux";
  } else if (aDesDonnees || vegan) {
    statut = "halal";
  } else {
    // Couvre les deux cas : aucune donnée, et une étiquette illisible pour nous.
    // Dans les deux, « inconnu » est la seule réponse honnête.
    statut = "inconnu";
  }

  // Un écran ne doit pas dire deux choses contraires. Mesuré le 11 août : un
  // produit portant un label halal affichait « HALAL — certifié ✓ » ET juste
  // dessous « ⚠️ Viande — abattage halal à vérifier, SAUF CERTIFICATION ».
  // Le doute était donc levé par la certification, de l'aveu même de la règle,
  // et on l'affichait quand même. On retire les doutes que le label répond —
  // reconnus à leur propre formulation. Jamais un interdit : celui-là fait
  // basculer le verdict et reste affiché.
  const leveParLeLabel = (a: Alerte) =>
    a.niveau !== "haram" && /sauf (certification|mention halal|origine halal)/i.test(a.raison);
  let alertesAffichees =
    certifieHalal && !aHaram ? alertesUniques.filter((a) => !leveParLeLabel(a)) : alertesUniques;
  // Même règle pour le végane : le doute auquel l'étiquette répond disparaît de
  // l'écran, les autres restent — et s'il en reste un, le verdict n'est plus
  // « halal » de toute façon.
  if (vegan && statut === "halal") {
    alertesAffichees = alertesAffichees.filter((a) => !leveParLeVegan(a));
  }

  return { statut, certifieHalal, vegan, alertes: alertesAffichees };
}
