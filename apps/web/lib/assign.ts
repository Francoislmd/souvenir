// Répartition automatique des photos par participant, calculée au dépôt —
// jamais avant (le nombre de participants réels n'est connu qu'à ce moment).
// v1 : index de dépôt. Prod : grappes EXIF (takenAt), repli sur l'index si
// inconclusif. Pas de reconnaissance faciale (RGPD art. 9) — voir brief §5.

const COMMON_PHOTO_COUNT = 3;

export interface AssignablePhoto {
  id: string;
}

export interface RegisteredParticipant {
  id: string;
}

/** photoId -> participantId | null (null = photo commune, envoyée à tous). */
export function computeOwnerAssignment(
  photos: AssignablePhoto[],
  participants: RegisteredParticipant[],
): Map<string, string | null> {
  const assignment = new Map<string, string | null>();
  const perso = photos.length - COMMON_PHOTO_COUNT;
  const each = Math.max(1, Math.floor(perso / Math.max(1, participants.length)));

  photos.forEach((photo, i) => {
    if (i >= perso || participants.length === 0) {
      assignment.set(photo.id, null);
      return;
    }
    const k = Math.min(participants.length - 1, Math.floor(i / each));
    assignment.set(photo.id, participants[k].id);
  });

  return assignment;
}

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
