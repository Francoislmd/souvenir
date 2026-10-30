/**
 * Ce qu'un client a payé, sur l'ensemble de ses commandes.
 *
 * Depuis la galerie privée (02/10/2026), un client peut acheter en plusieurs
 * fois : deux photos le soir même, le reste le lendemain. Le lot est plafonné
 * d'une commande à l'autre, comme chez Finisher Memories : dès que le cumul
 * payé atteint le prix du lot, tout le créneau est à lui, y compris les
 * photos que l'opérateur ajoute ensuite.
 *
 * Seules les commandes « succeeded » comptent : un remboursement ou un litige
 * fait sortir la commande du calcul, et re-verrouille ses photos au prochain
 * chargement (même principe qu'avant, commande par commande).
 */

export interface OrderLike {
  status: string;
  photoIds: string[];
  amountCents: number;
  isPack: boolean;
}

export interface Access {
  /** Au moins une commande payée. */
  bought: boolean;
  /** Somme payée, toutes commandes confondues. */
  paidCents: number;
  /** Le lot est atteint : tout est débloqué. */
  packReached: boolean;
  /** Les photos achetées une à une (sans objet quand packReached). */
  ids: Set<string>;
}

export function accessFromOrders(orders: OrderLike[], priceAllCents: number): Access {
  const paid = orders.filter((o) => o.status === "succeeded");
  const paidCents = paid.reduce((sum, o) => sum + o.amountCents, 0);
  return {
    bought: paid.length > 0,
    paidCents,
    packReached: paid.some((o) => o.isPack) || (paid.length > 0 && paidCents >= priceAllCents),
    ids: new Set(paid.flatMap((o) => o.photoIds)),
  };
}

/** Ce qu'il reste à payer au plus pour avoir tout le lot. */
export function remainingCapCents(access: Access, priceAllCents: number): number {
  return Math.max(0, priceAllCents - access.paidCents);
}

/**
 * Les photos qu'un client peut voir : celles de la sortie qui sont à lui ou
 * communes. En sortie de groupe, aucune photo n'a de propriétaire : le client
 * voit toute la sortie. Plus de notion de départ depuis le 30/10/2026 (une
 * sortie = une galerie) ; `slotId` est accepté mais ignoré. Une seule
 * définition, partagée par la galerie, le paiement et l'archive zip : ce qui
 * se voit est exactement ce qui s'achète et se télécharge.
 */
export function visiblePhotoWhere(participant: { id: string; sortieId: string; slotId?: string | null }) {
  return { sortieId: participant.sortieId, hiddenAt: null, status: { not: "FAILED" as const }, OR: [{ ownerId: participant.id }, { ownerId: null }] };
}
