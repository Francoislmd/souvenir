import type Stripe from "stripe";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendReviewRequest } from "./automations";

export async function fulfillPaymentIntent(intent: Stripe.PaymentIntent): Promise<void> {
  const participantId = intent.metadata?.participantId;
  if (!participantId) return;

  const order = await prisma.order.findUnique({ where: { participantId } });
  if (!order || order.stripePi !== intent.id || order.status === "succeeded") return;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "succeeded", paidAt: new Date() },
  });

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { sortie: { include: { operator: true } } },
  });
  if (!participant) return;

  await track("purchase_succeeded", {
    operatorId: participant.sortie.operatorId,
    participantId,
    meta: { amountCents: updated.amountCents },
  });

  await sendReviewRequest(participant, participant.sortie.operator);
}
