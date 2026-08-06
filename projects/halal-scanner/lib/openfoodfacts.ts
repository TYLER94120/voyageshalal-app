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
 * Cherche un produit par code-barres.
 * Retourne null si le produit n'existe pas dans la base.
 * Lève une erreur en cas de problème réseau.
 */
export async function chercherProduit(code: string): Promise<ProduitOFF | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${CHAMPS}`;
  const reponse = await fetch(url, {
    headers: { "User-Agent": "HalalCheck/0.1 (halalcheck.fr)" },
  });
  if (reponse.status === 404) return null;
  if (!reponse.ok) throw new Error(`Open Food Facts a répondu ${reponse.status}`);

  const json = await reponse.json();
  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  return {
    code,
    nom: p.product_name || null,
    marque: p.brands || null,
    imageUrl: p.image_front_url || p.image_url || null,
    ingredientsTexte: p.ingredients_text_fr || p.ingredients_text || null,
    additifs: Array.isArray(p.additives_tags) ? p.additives_tags : [],
    labels: Array.isArray(p.labels_tags) ? p.labels_tags : [],
  };
}
