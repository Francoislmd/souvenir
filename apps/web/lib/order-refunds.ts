import type Stripe from "stripe";
import { prisma } from "./prisma";
import { track } from "./analytics";

function getPaymentIntentId(pi: string | Stripe.PaymentIntent | null): string | null {
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

async function loadOrderWithOperator(stripePi: string) {
  return prisma.order.findUnique({
    where: { stripePi },
    include: { participant: { include: { sortie: true } } },
  });
}

/**
 * charge.refunded se rejoue (retry Stripe) et se redéclenche à chaque
 * remboursement partiel supplémentaire sur une même charge — amount_refunded
 * est cumulatif, donc le comparer à ce qu'on a déjà stocké suffit comme garde
 * d'idempotence, sans table d'event-id (même convention que fulfillPaymentIntent).
 */
export async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const piId = getPaymentIntentId(charge.payment_intent);
  if (!piId) return;

  const order = await loadOrderWithOperator(piId);
  if (!order || charge.amount_refunded <= order.refundedAmountCents) return;

  // Pas de politique de remboursement partiel : tout remboursement verrouille
  // la galerie (order.status !== "succeeded" re-verrouille au prochain
  // chargement/poll, cf. lib/gallery.ts — aucun code de révocation à part).
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      refundedAmountCents: charge.amount_refunded,
      refundedAt: new Date(),
      status: "refunded",
    },
  });

  await track("order_refunded", {
    operatorId: order.participant.sortie.operatorId,
    participantId: order.participantId,
    meta: { amountRefundedCents: updated.refundedAmountCents, isFullRefund: charge.refunded },
  });
}

export async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const piId = getPaymentIntentId(dispute.payment_intent);
  if (!piId) return;

  const order = await loadOrderWithOperator(piId);
  if (!order || order.disputeStatus === dispute.status) return;

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "disputed", disputeStatus: dispute.status, disputedAt: new Date() },
  });

  await track("order_disputed", {
    operatorId: order.participant.sortie.operatorId,
    participantId: order.participantId,
    meta: { reason: dispute.reason, amountCents: dispute.amount },
  });
}

export async function handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
  const piId = getPaymentIntentId(dispute.payment_intent);
  if (!piId) return;

  const order = await loadOrderWithOperator(piId);
  if (!order || order.disputeStatus === dispute.status) return;

  // "won" : le marchand garde les fonds, l'accès galerie est restauré.
  // Tout autre motif de clôture ("lost", "warning_closed", …) : les fonds
  // sont perdus par chargeback, traité comme un remboursement total.
  const nextStatus = dispute.status === "won" ? "succeeded" : "refunded";

  await prisma.order.update({
    where: { id: order.id },
    data: { status: nextStatus, disputeStatus: dispute.status, disputeClosedAt: new Date() },
  });

  await track("order_dispute_resolved", {
    operatorId: order.participant.sortie.operatorId,
    participantId: order.participantId,
    meta: { outcome: dispute.status },
  });
}
