/**
 * La commission Linktrip rendue lors d'un remboursement.
 *
 * Depuis le 11/10/2026, un remboursement rend aussi la commission, au prorata
 * du montant remboursé (`refund_application_fee: true`, lib/order-refunds.ts) :
 * Stripe reprend sur le solde de Linktrip la part de commission qui
 * correspond. Ce fichier ne touche pas la base : les composants client
 * l'importent.
 */
export function feeRefundedCents(feeCents: number, amountCents: number, refundedCents: number): number {
  if (amountCents <= 0 || refundedCents <= 0) return 0;
  return Math.min(feeCents, Math.round((feeCents * refundedCents) / amountCents));
}

/** Ce que Linktrip garde de sa commission après remboursement. */
export function feeKeptCents(feeCents: number, amountCents: number, refundedCents: number): number {
  return feeCents - feeRefundedCents(feeCents, amountCents, refundedCents);
}
