// Petit relais pour « projeter » une ville sur la carte d'accueil depuis un
// autre écran (fiche ville → bouton « Voir sur la carte »). L'écran d'accueil
// consomme la valeur à son retour au premier plan.

export interface PendingCity {
  slug: string;
  nom: string;
  latitude?: number;
  longitude?: number;
}

let pending: PendingCity | null = null;

export function setPendingCity(city: PendingCity): void {
  pending = city;
}

/** Récupère ET vide la ville en attente (one-shot). */
export function consumePendingCity(): PendingCity | null {
  const c = pending;
  pending = null;
  return c;
}
