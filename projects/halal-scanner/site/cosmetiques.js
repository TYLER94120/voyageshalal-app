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
        motif: /\btallow\b|sodium tallowate|potassium tallowate|tallowate|\bsuif\b/,
        element: "Suif (Tallow)",
        niveau: "haram",
        raison: "Graisse de bœuf ou de mouton fondue, très utilisée dans les savons. Interdite sauf origine halal certifiée.",
        famille: "suif",
    },
    {
        motif: /\blard\b|porcine|\bpork\b|sus scrofa|porc\b/,
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
        motif: /\bkeratin\b|kératine|hydrolyzed keratin/,
        element: "Kératine",
        niveau: "douteux",
        raison: "Extraite de laine, plumes, cornes ou sabots — origine et abattage non vérifiables.",
        famille: "keratine",
    },
    {
        motif: /\bgelatin\b|gélatine|hydrolyzed gelatin/,
        element: "Gélatine",
        niveau: "douteux",
        raison: "Souvent d'origine porcine ou bovine, sauf mention halal.",
        famille: "gelatine",
    },
    {
        motif: /stearic acid|acide stéarique|\bstearate\b|stéarate|glyceryl stearate|sodium stearate|magnesium stearate/,
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
export function analyserCosmetique(entree) {
    var _a, _b, _c, _d;
    const labels = ((_a = entree.labels) !== null && _a !== void 0 ? _a : []).map((l) => l.toLowerCase());
    const certifieHalal = labels.some((l) => l.includes("halal"));
    const vegan = labels.some((l) => l.includes("vegan") || l.includes("vegetalien"));
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
    const aDesDonnees = texte.trim().length >= 10;
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
