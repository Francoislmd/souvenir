/**
 * Garde-fou sur la régénération des aperçus filigranés.
 *
 * `backfillGroupPreviews` retélécharge l'original et relance sharp +
 * @napi-rs/canvas. Il est appelé depuis deux routes PUBLIQUES que la galerie
 * sonde toutes les 4 secondes tant qu'il manque un aperçu
 * (/api/g/[token]/photos et /api/store/[slug]/slots/[slotId]/photos). Sans
 * garde-fou, une seule photo durablement en échec — original corrompu, format
 * que sharp refuse — suffit à relancer un rendu d'image toutes les 4 secondes,
 * indéfiniment, pour chaque onglet ouvert. C'était le poste de coût le plus
 * dangereux du produit, et un déni de service gratuit pour qui ouvre dix
 * onglets sur une boutique publique.
 *
 * Mémoire du processus, volontairement : une instance serverless vit assez
 * longtemps pour absorber le martèlement d'un client qui attend, et c'est
 * exactement le cas à couvrir. Pas de table, pas de Redis — le repli en cas
 * d'instance neuve est une tentative de plus, pas une panne.
 */
const RETRY_COOLDOWN_MS = 10 * 60 * 1000;

// Photos dont on vient de tenter la régénération, et quand.
const lastAttempt = new Map<string, number>();

/**
 * Filtre les photos éligibles à une nouvelle tentative et marque celles qui
 * passent. À appeler juste avant backfillGroupPreviews, jamais après.
 */
export function throttleBackfill<T extends { id: string }>(photos: T[], now: number = Date.now()): T[] {
  // Ménage opportuniste : la Map ne doit pas grossir indéfiniment sur une
  // instance longue. Fait ici plutôt que sur un minuteur, qui garderait
  // l'instance éveillée.
  if (lastAttempt.size > 5000) {
    lastAttempt.forEach((at, id) => {
      if (now - at > RETRY_COOLDOWN_MS) lastAttempt.delete(id);
    });
  }

  const eligible: T[] = [];
  for (const photo of photos) {
    const previous = lastAttempt.get(photo.id);
    if (previous !== undefined && now - previous < RETRY_COOLDOWN_MS) continue;
    lastAttempt.set(photo.id, now);
    eligible.push(photo);
  }
  return eligible;
}
