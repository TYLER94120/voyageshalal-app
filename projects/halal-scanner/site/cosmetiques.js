// Moteur d'analyse halal des cosmétiques (shampooings, crèmes, savons…).
//
// Les cosmétiques ne se lisent pas comme l'alimentaire :
//  - les ingrédients suivent la nomenclature INCI (latin/anglais) ;
//  - l'usage est externe, et plusieurs écoles distinguent l'ingestion de
//    l'application sur la peau — nos formulations le rappellent ;
//  - le piège classique : « Cetyl / Cetearyl / Stearyl Alcohol » sont des
//    CIRES GRASSES, pas de l'alcool. Beaucoup d'applications les signalent à
//    tort. Ici, seuls les alcools éthyliques sont relevés.
//
// Analyse indicative : elle ne remplace ni une certification, ni un avis
// religieux.
// Interdits : l'origine est établie, pas seulement possible.
export const REGLES_INTERDITES = [
    {
        // « Tallowamide », « Tallowamine », « Suet » : mesures du 11 août, tous
        // trois muets alors que ce sont des noms INCI réels. \btallow\b s'arrête
        // au mot exact — le même piège que « lardons » côté alimentaire.
        motif: /\btallow\w*\b|sodium tallowate|potassium tallowate|\bsuif\b|\bsuet\b|adeps bovis/,
        element: "Suif (Tallow)",
        niveau: "haram",
        raison: "Graisse de bœuf ou de mouton fondue, très utilisée dans les savons. Interdite sauf origine halal certifiée.",
        famille: "suif",
    },
    {
        // « Adeps Suillus » est le nom latin INCI de la graisse de porc, et le
        // moteur était muet devant : mesuré le 11 août.
        motif: /\blard\b|porcine|\bpork\b|sus scrofa|porc\b|adeps suillus/,
        element: "Dérivé de porc",
        niveau: "haram",
        raison: "Ingrédient d'origine porcine — interdit.",
        famille: "porc",
    },
    {
        motif: /\bplacenta\b|placental/,
        element: "Placenta",
        niveau: "haram",
        raison: "Extrait de placenta animal — interdit.",
    },
    {
        motif: /\bcarmine\b|ci 75470|cochineal|carminic acid/,
        element: "Carmin (CI 75470)",
        niveau: "haram",
        raison: "Colorant rouge extrait d'insectes broyés — considéré non licite par la majorité des avis.",
        famille: "carmin",
    },
];
// À vérifier : l'ingrédient existe en version végétale ET animale, sans que
// l'étiquette permette de trancher.
export const REGLES_DOUTEUSES = [
    {
        motif: /\bcollagen\b|collagène|hydrolyzed collagen|soluble collagen/,
        element: "Collagène",
        niveau: "douteux",
        raison: "Extrait de peau, d'os ou d'écailles ; l'espèce et l'abattage ne sont pas précisés.",
        famille: "collagene",
    },
    {
        motif: /\belastin\b|élastine/,
        element: "Élastine",
        niveau: "douteux",
        raison: "Protéine d'origine animale (tissus conjonctifs) — origine à confirmer.",
    },
    {
        motif: /\bkeratins?\b|kératines?|hydrolyzed keratin|\bl-?cysteines?\b|\bcysteines?\b|\bcystines?\b|cystéines?/,
        element: "Kératine",
        niveau: "douteux",
        raison: "Extraite de laine, plumes, cornes ou sabots — origine et abattage non vérifiables.",
        famille: "keratine",
    },
    {
        motif: /\bgelatines?\b|\bgelatin\b|gélatines?|hydrolyzed gelatin/,
        element: "Gélatine",
        niveau: "douteux",
        raison: "Souvent d'origine porcine ou bovine, sauf mention halal.",
        famille: "gelatine",
    },
    {
        motif: /stearic acid|acide stéarique|\bstearates?\b|stéarates?|glyceryl stearate|sodium stearate|magnesium stearate|\bstearoyl\b|\bstearamide\b/,
        element: "Acide stéarique / stéarates",
        niveau: "douteux",
        raison: "Très majoritairement d'origine végétale (palme, coco) dans les cosmétiques européens. Origine animale rare mais possible.",
        gravite: "faible",
        famille: "stearique",
    },
    {
        motif: /\bglycerin\b|\bglycerine\b|glycérine|\bglycerol\b/,
        element: "Glycérine",
        niveau: "douteux",
        raison: "Aujourd'hui presque toujours végétale (palme, coco) ou synthétique en Europe. Le doute est théorique, sauf produit importé sans mention.",
        gravite: "faible",
        famille: "glycerine",
    },
    {
        motif: /\bsqualene\b|\bsqualane\b|squalène/,
        element: "Squalène / Squalane",
        niveau: "douteux",
        raison: "Extrait de foie de requin ou d'olive — les deux origines coexistent sur le marché.",
        famille: "squalene",
    },
    {
        motif: /\blanolin\b|lanoline|lanolin alcohol|\bcera lanae\b/,
        element: "Lanoline",
        niveau: "douteux",
        raison: "Graisse issue de la laine de mouton, l'animal n'étant pas abattu : largement admise, mais l'origine reste à confirmer.",
        famille: "lanoline",
    },
    {
        motif: /snail secretion|helix aspersa|\bmucin\b|bave d'escargot/,
        element: "Bave d'escargot (Snail Secretion Filtrate)",
        niveau: "douteux",
        raison: "Sécrétion prélevée sur un animal vivant. Les avis divergent : certains l'assimilent à un produit d'animal non abattu, d'autres l'écartent car l'escargot n'est pas consommable.",
        famille: "escargot",
    },
    {
        motif: /\bcastoreum\b|\bcivette?\b|\bmusk\b|\bmusc\b|\bambergris\b|ambre gris/,
        element: "Sécrétion animale de parfumerie",
        niveau: "douteux",
        raison: "Castoréum, civette, musc et ambre gris sont prélevés sur des animaux. Les versions de synthèse sont aujourd'hui majoritaires, mais l'étiquette ne le précise pas.",
        famille: "secretions-parfumerie",
    },
    {
        motif: /\bretinols?\b|rétinol|retinyl palmitate/,
        element: "Rétinol",
        niveau: "douteux",
        raison: "Obtenu par synthèse dans la quasi-totalité des cosmétiques ; historiquement extrait de foie animal. Le doute est théorique.",
        gravite: "faible",
        famille: "retinol",
    },
    {
        motif: /\bcholesterol\b|cholestérol|cholesteryl/,
        element: "Cholestérol",
        niveau: "douteux",
        raison: "Le plus souvent extrait de lanoline (laine, animal non abattu) ou produit par synthèse.",
        gravite: "faible",
    },
    {
        motif: /hyaluronic acid|acide hyaluronique|sodium hyaluronate/,
        element: "Acide hyaluronique",
        niveau: "douteux",
        raison: "Obtenu par fermentation bactérienne chez la quasi-totalité des fabricants aujourd'hui.",
        gravite: "faible",
    },
    {
        motif: /\bguanine\b|ci 75170|pearl essence/,
        element: "Guanine (CI 75170)",
        niveau: "douteux",
        raison: "Nacre irisante extraite d'écailles de poisson — licite pour beaucoup, à confirmer.",
    },
    {
        motif: /\bshellac\b|gomme.laque|\bci 75100\b/,
        element: "Gomme-laque (Shellac)",
        niveau: "douteux",
        raison: "Résine sécrétée par un insecte — les avis divergent.",
    },
    {
        motif: /\bchitosan\b|chitine|\bchitin\b/,
        element: "Chitosane",
        niveau: "douteux",
        raison: "Extrait de carapaces de crustacés — licéité variable selon les écoles.",
    },
    {
        motif: /\bmusk\b|\bmuscone\b|ambergris|ambre gris|civet/,
        element: "Musc animal / ambre gris",
        niveau: "douteux",
        raison: "Le musc de chevrotain et l'ambre gris sont d'origine animale ; la version synthétique est licite.",
    },
    {
        motif: /oleic acid|acide oléique|\boleyl\b|oleth-/,
        element: "Acide oléique / dérivés",
        niveau: "douteux",
        raison: "Généralement d'origine végétale (olive, colza) dans les cosmétiques modernes.",
        gravite: "faible",
        famille: "oleique",
    },
    {
        motif: /palmitic acid|myristic acid|lauric acid|palmitate de sodium|sodium palmitate/,
        element: "Acides gras (palmitique, myristique, laurique)",
        niveau: "douteux",
        raison: "Issus de la palme ou du coco dans l'immense majorité des cas.",
        gravite: "faible",
        famille: "acides-gras",
    },
    {
        motif: /\bsilk\b|\bserica\b|hydrolyzed silk|\bsericin\b/,
        element: "Soie (Serica)",
        niveau: "douteux",
        raison: "Protéine issue du cocon du ver à soie — largement admise, mentionnée pour information.",
    },
    {
        motif: /\bcarbo animalis\b|bone char|\bcharbon animal\b|ci 77268/,
        element: "Noir animal (charbon d'os)",
        niveau: "douteux",
        raison: "Pigment obtenu à partir d'os calcinés — abattage non vérifiable.",
    },
    {
        motif: /\bemu oil\b|\bmink oil\b|huile de vison|\bsnake oil\b|\bturtle oil\b/,
        element: "Huile animale (émeu, vison…)",
        niveau: "douteux",
        raison: "Huile extraite d'un animal — espèce et abattage à vérifier.",
    },
    {
        motif: /\ballantoin\b|allantoïne/,
        element: "Allantoïne",
        niveau: "douteux",
        raison: "Produite par synthèse dans la quasi-totalité des cosmétiques actuels ; l'origine animale historique a disparu.",
        gravite: "faible",
    },
    {
        motif: /\burea\b(?!.*peroxide)|\burée\b/,
        element: "Urée",
        niveau: "douteux",
        raison: "Obtenue par synthèse chimique dans les cosmétiques ; l'origine animale n'est plus utilisée.",
        gravite: "faible",
    },
];
// Alcools : seuls les alcools éthyliques sont relevés. Les alcools gras
// (cires) sont explicitement exclus — c'est l'erreur la plus répandue.
export const REGLES_ALCOOL = [
    {
        motif: /\balcohol denat\b|denatured alcohol|\bsd alcohol\b|\bethanol\b|\bethyl alcohol\b|alcool dénaturé/,
        element: "Alcool éthylique (Alcohol Denat.)",
        niveau: "douteux",
        raison: "Alcool non potable, servant de support ou d'antiseptique. Beaucoup de savants l'autorisent en usage externe ; d'autres le déconseillent.",
        famille: "alcool-ethylique",
    },
];
const ALCOOLS_GRAS = /cetyl alcohol|cetearyl alcohol|stearyl alcohol|behenyl alcohol|myristyl alcohol|lauryl alcohol|arachidyl alcohol|batyl alcohol/g;
function normaliser(texte) {
    let t = texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    // Les alcools gras sont des cires : on les neutralise avant toute recherche
    // pour ne jamais les confondre avec de l'alcool éthylique.
    t = t.replace(ALCOOLS_GRAS, " cire grasse ");
    t = t.replace(/vegetable origin|d'origine vegetale|plant.derived/g, " origine vegetale ");
    return t;
}
/**
 * Analyse un cosmétique à partir de sa liste INCI.
 * Un label halal certifié prime ; un produit végane écarte les doutes
 * d'origine animale (mais pas l'alcool éthylique).
 */
/**
 * Même garde-fou que dans le moteur alimentaire : nos motifs INCI sont
 * latins. Une étiquette écrite uniquement en arabe ne déclenche rien, et
 * « aucune alerte » ne doit jamais devenir « halal ».
 *
 * Et, depuis le 12 août, même second garde-fou : une phrase qui dit « on ne
 * sait pas » est faite de lettres et passait pour une liste INCI lisible.
 * Voir le commentaire détaillé dans `halal.ts` — 16 formulations sur 28
 * rendaient HALAL sans preuve. Le défaut était identique ici.
 */
const MENTIONS_ABSENCE = /non renseign\w*|non sp[ée]cifi\w*|non communiqu\w*|non disponibles?|pas d'informations?|aucune information|liste non disponible|ingr[ée]dients? non disponibles?|[àa] compl[ée]ter|[àa] renseigner|voir (?:sur )?(?:l'|le )?emballage|see (?:the )?packaging|not available|no information|unknown/gi;
function texteAnalysable(texte) {
    const sansMentions = texte.replace(MENTIONS_ABSENCE, " ");
    return (sansMentions.match(/[a-zà-öø-ÿ]/gi) || []).length >= 12;
}
/**
 * Même piège que dans le moteur alimentaire, et même correctif : « non-halal »
 * contient « halal ». Voir le commentaire détaillé de `NEGATION` dans
 * `halal.ts` — huit étiquettes qui nient le halal étaient lues comme une
 * certification. En cas d'ambiguïté, on NE certifie PAS.
 */
const NEGATION = /(^|[-_\s:])(non|not|no|sans|without)([-_\s]|$)/;
function affirme(label, motif) {
    return motif.test(label) && !NEGATION.test(label);
}
export function analyserCosmetique(entree) {
    var _a, _b, _c, _d, _e;
    const labels = ((_a = entree.labels) !== null && _a !== void 0 ? _a : []).map((l) => l.toLowerCase());
    const certifieHalal = labels.some((l) => affirme(l, /halal/));
    const vegan = labels.some((l) => affirme(l, /vegan|vegetalien/));
    const texte = normaliser((_b = entree.ingredientsTexte) !== null && _b !== void 0 ? _b : "");
    const alertes = [];
    const vues = new Set();
    const toutes = [...REGLES_INTERDITES, ...REGLES_DOUTEUSES, ...REGLES_ALCOOL];
    for (const regle of toutes) {
        if (!regle.motif.test(texte))
            continue;
        const cle = ((_c = regle.famille) !== null && _c !== void 0 ? _c : regle.element).toLowerCase();
        // Un produit végane écarte les doutes d'origine animale, jamais l'alcool.
        if (vegan && regle.niveau === "douteux" && regle.famille !== "alcool-ethylique")
            continue;
        if (vues.has(cle))
            continue;
        vues.add(cle);
        alertes.push({
            element: regle.element,
            niveau: regle.niveau,
            raison: regle.raison,
            famille: regle.famille,
            gravite: (_d = regle.gravite) !== null && _d !== void 0 ? _d : "moderee",
        });
    }
    alertes.sort((a, b) => {
        const poids = (x) => x.niveau === "haram" ? 0 : x.gravite === "faible" ? 2 : 1;
        return poids(a) - poids(b);
    });
    const aHaram = alertes.some((a) => a.niveau === "haram");
    const aDouteux = alertes.some((a) => a.niveau === "douteux");
    // On ne conclut « halal » que sur une liste INCI réellement lisible par nos
    // règles. Un flacon dont l'étiquette n'est écrite qu'en arabe reste inconnu.
    const aDesDonnees = texteAnalysable((_e = entree.ingredientsTexte) !== null && _e !== void 0 ? _e : "");
    let statut;
    if (certifieHalal && !aHaram)
        statut = "halal";
    else if (aHaram)
        statut = "haram";
    else if (aDouteux)
        statut = "douteux";
    else if (aDesDonnees)
        statut = "halal";
    else
        statut = "inconnu";
    return { statut, certifieHalal, vegan, alertes };
}
