import type Stripe from "stripe";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { stripe } from "./stripe";

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

  // Remboursement total : la galerie se verrouille (order.status !==
  // "succeeded" re-verrouille au prochain chargement, cf. lib/gallery.ts).
  // Remboursement partiel (geste du pro depuis Revenus, 11/10/2026) : le
  // client garde ses photos, seul le montant remboursé est enregistré.
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      refundedAmountCents: charge.amount_refunded,
      refundedAt: new Date(),
      ...(charge.refunded ? { status: "refunded" } : {}),
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

export type RefundResult =
  | { ok: true; refundedCents: number; full: boolean }
  | { ok: false; error: "not_found" | "not_refundable" | "invalid_amount" | "stripe"; message: string };

/**
 * Le pro rembourse tout ou partie d'un achat, depuis le détail d'une vente.
 *
 * Charge directe : le remboursement part du compte Stripe du pro
 * (`stripeAccount`) et la commission Linktrip n'est pas rendue
 * (`refund_application_fee: false`) — c'est la règle. Le plafond est ce que
 * le client a payé, moins ce qui lui a déjà été rendu.
 *
 * La base est mise à jour tout de suite, sans attendre le webhook :
 * charge.refunded arrivera ensuite avec le même cumul et sera ignoré
 * (handleChargeRefunded compare amount_refunded au montant stocké).
 */
export async function refundOrder(operatorId: string, orderId: string, amountCents: number): Promise<RefundResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, participant: { sortie: { operatorId } } },
    include: { participant: { include: { sortie: { include: { operator: { select: { stripeAccountId: true } } } } } } },
  });
  if (!order) return { ok: false, error: "not_found", message: "Achat introuvable." };

  const account = order.participant.sortie.operator.stripeAccountId;
  const remaining = order.amountCents - order.refundedAmountCents;
  if (order.status !== "succeeded" || order.disputeStatus || !order.stripePi || !account || remaining <= 0) {
    return { ok: false, error: "not_refundable", message: "Cet achat ne peut plus être remboursé." };
  }
  if (!Number.isInteger(amountCents) || amountCents < 50 || amountCents > remaining) {
    return { ok: false, error: "invalid_amount", message: "Le montant doit être compris entre 0,50 € et ce que le client a payé." };
  }

  try {
    await stripe.refunds.create(
      {
        payment_intent: order.stripePi,
        amount: amountCents,
        refund_application_fee: false,
        metadata: { orderId: order.id },
      },
      // Un double clic ne rembourse pas deux fois : même cumul, même montant, même clé.
      { stripeAccount: account, idempotencyKey: `refund-${order.id}-${order.refundedAmountCents}-${amountCents}` },
    );
  } catch (error) {
    console.error("[refund] Stripe a refusé le remboursement", error);
    const message =
      error && typeof error === "object" && "code" in error && error.code === "balance_insufficient"
        ? "Votre solde Stripe ne suffit pas pour ce remboursement."
        : "Stripe a refusé le remboursement. Réessayez, ou faites-le depuis votre tableau de bord Stripe.";
    return { ok: false, error: "stripe", message };
  }

  const refundedCents = order.refundedAmountCents + amountCents;
  const full = refundedCents >= order.amountCents;
  await prisma.order.update({
    where: { id: order.id },
    data: { refundedAmountCents: refundedCents, refundedAt: new Date(), ...(full ? { status: "refunded" } : {}) },
  });
  await track("order_refunded", {
    operatorId,
    participantId: order.participantId,
    meta: { amountRefundedCents: refundedCents, isFullRefund: full, source: "operator" },
  });
  return { ok: true, refundedCents, full };
}
