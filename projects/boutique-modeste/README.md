# Malika ✦ Paris — boutique de mode modeste

Pousse n°3 de l'écosystème halal (stratégie arrosoir — voir `docs/PORTFOLIO.md` à la racine du repo).

Boutique **en un seul fichier** (`index.html`) : catalogue filtrable, panier persistant,
commande par WhatsApp. Zéro backend, zéro stock obligatoire au départ, déployable en 2 minutes.

## Pourquoi cette version "légère"

Le e-commerce est le projet le plus lourd à opérer seul. Cette v0 élimine tout ce qui
bloque : pas de paiement en ligne à configurer, pas de CMS, pas de serveur. La commande
arrive **sur WhatsApp**, tu confirmes, tu encaisses par lien (PayPal/Stripe/Lydia) — c'est
exactement comme ça que démarrent la plupart des boutiques modestes sur Instagram.

## Mise en ligne (2 minutes)

1. Ouvre `index.html`, remplace dans `CONFIG` le numéro WhatsApp (`33600000000` → le tien).
2. Remplace les produits de démonstration dans `PRODUITS` (noms, prix, et tes photos via `image: "url"` à brancher).
3. Glisse le dossier sur **Netlify Drop** (netlify.com/drop) ou déploie avec `vercel` — c'est en ligne.

## Identité & domaines (libres au dernier pointage)

- **malika-paris.fr** — la marque (renommable en 1 ligne dans `CONFIG`)
- **modemodeste.fr + .com** — SEO descriptif, à rediriger vers la boutique
- **hijabs.fr** — générique rare encore libre, très forte valeur SEO
- Alternatives libres : noorwear.fr, modestywear.fr, amanistore.fr, modest-paris.fr

## Métriques de décision (fenêtre 8–12 semaines)

- Commandes WhatsApp reçues / semaine.
- Taux d'ajout au panier.
- Si ça décolle → paiement Stripe Payment Links, puis migration Shopify au-delà de ~30 commandes/mois.

## À faire avant la vraie ouverture

- [ ] Vraies photos produits (fond neutre, sans visages — cohérent avec la charte).
- [ ] Mentions légales + CGV + politique de retour.
- [ ] Choisir le fournisseur (achat en gros ou dropshipping UE pour délais courts).
- [ ] Compte Instagram + TikTok de la marque (vérifier la disponibilité des handles).
