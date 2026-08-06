// Client Open Food Facts — base alimentaire mondiale, ouverte et gratuite.

export interface ProduitOFF {
  code: string;
  nom: string | null;
  marque: string | null;
  imageUrl: string | null;
  ingredientsTexte: string | null;
  additifs: string[];
  labels: string[];
}

const CHAMPS = [
  "product_name",
  "brands",
  "image_front_url",
  "image_url",
  "ingredients_text_fr",
  "ingredients_text",
  "additives_tags",
  "labels_tags",
].join(",");

/**
 * Étiquettes bilingues (Maroc, Algérie, Tunisie…) : extrait la partie
 * française/latine. Si le texte est presque entièrement en arabe, on garde
 * l'original plutôt que d'afficher du vide.
 */
export function nettoyerIngredients(texte: string | null): string | null {
  if (!texte) return texte;
  const sansArabe = texte
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,;:.)\]])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();
  const lettresLatines = (sansArabe.match(/[a-zà-öø-ÿ]/gi) || []).length;
  return lettresLatines >= 12 ? sansArabe : texte;
}

// Un même produit peut être stocké en 12 chiffres (UPC) ou 13 (EAN).
function candidatsCode(code: string): string[] {
  const c = code.replace(/\D/g, "");
  const liste = [c];
  if (c.length === 12) liste.push("0" + c);
  if (c.length === 13 && c.startsWith("0")) liste.push(c.slice(1));
  return [...new Set(liste)].filter((x) => x.length >= 6);
}

// On ne se fie pas au champ "status" (format variable selon les versions de
// l'API) : un produit est trouvé si l'objet product est présent et rempli.
async function requeteProduit(url: string): Promise<Record<string, unknown> | null> {
  const reponse = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "HalalCheck/0.1 (halalcheck.fr)" },
  });
  if (reponse.status === 404) return null;
  if (!reponse.ok) throw new Error(`Open Food Facts a répondu ${reponse.status}`);
  const json = await reponse.json();
  const p = json && json.product;
  return p && typeof p === "object" && Object.keys(p).length > 0
    ? (p as Record<string, unknown>)
    : null;
}

/**
 * Cherche un produit par code-barres (variantes UPC/EAN, API v2 puis v0).
 * Retourne null si le produit n'existe pas dans la base.
 * Lève une erreur si tout a échoué pour cause réseau.
 */
export async function chercherProduit(code: string): Promise<ProduitOFF | null> {
  let erreurReseau: unknown = null;
  for (const c of candidatsCode(code)) {
    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${c}.json?fields=${CHAMPS}`,
      `https://world.openfoodfacts.org/api/v0/product/${c}.json`,
    ];
    for (const url of urls) {
      try {
        const p = await requeteProduit(url);
        if (p) {
          return {
            code: c,
            nom: (p.product_name as string) || null,
            marque: (p.brands as string) || null,
            imageUrl: (p.image_front_url as string) || (p.image_url as string) || null,
            ingredientsTexte:
              (p.ingredients_text_fr as string) || (p.ingredients_text as string) || null,
            additifs: Array.isArray(p.additives_tags) ? (p.additives_tags as string[]) : [],
            labels: Array.isArray(p.labels_tags) ? (p.labels_tags as string[]) : [],
          };
        }
      } catch (e) {
        erreurReseau = e;
      }
    }
  }
  if (erreurReseau) throw erreurReseau;
  return null;
}
