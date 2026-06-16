import type Stripe from "stripe";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { maybeSendReviewMessage } from "./reviews";

/**
 * Idempotent : appelée par le webhook Stripe ET en filet de sécurité depuis la page
 * galerie au retour de Checkout (utile en local sans `stripe listen`, et si le
 * webhook est en retard/raté).
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") return;

  const deliveryId = session.metadata?.deliveryId;
  if (!deliveryId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) return;

  const existing = await prisma.order.findUnique({ where: { stripePaymentId: paymentIntentId } });
  if (existing) return;

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { session: { include: { operator: true } } },
  });
  if (!delivery) return;

  const amountCents = session.amount_total ?? 0;
  const feeCents = Math.round((amountCents * delivery.session.operator.feePercent) / 100);

  await prisma.order.create({
    data: { deliveryId, amountCents, feeCents, stripePaymentId: paymentIntentId, status: "succeeded" },
  });

  await prisma.delivery.update({ where: { id: deliveryId }, data: { status: "PURCHASED" } });

  await prisma.processingJob.createMany({
    data: (await prisma.media.findMany({ where: { deliveryId }, select: { id: true } })).map((media) => ({
      mediaId: media.id,
      kind: "zip",
    })),
  });

  await track("purchase_succeeded", { operatorId: delivery.session.operatorId, deliveryId });

  await maybeSendReviewMessage(delivery);
}
