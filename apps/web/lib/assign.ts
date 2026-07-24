// La répartition par participant est manuelle (le pro sélectionne des photos
// et les attribue depuis l'écran de tri) — aucune répartition automatique au
// dépôt. Reste ici le calcul des échantillons offerts, appliqué à l'envoi
// sur la répartition finale telle que le pro l'a laissée.

/**
 * Les `freeCount` premières photos personnelles de chaque participant (dans
 * l'ordre de dépôt) sont offertes — débloquées sans achat, dès l'envoi.
 */
export function computeFreeSamples(
  ownerAssignment: Map<string, string | null>,
  photoOrder: string[],
  freeCount: number,
): Set<string> {
  const free = new Set<string>();
  const seenPerOwner = new Map<string, number>();

  for (const photoId of photoOrder) {
    const ownerId = ownerAssignment.get(photoId);
    if (!ownerId) continue;
    const seen = seenPerOwner.get(ownerId) ?? 0;
    if (seen < freeCount) {
      free.add(photoId);
      seenPerOwner.set(ownerId, seen + 1);
    }
  }

  return free;
}
