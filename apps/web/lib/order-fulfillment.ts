import type Stripe from "stripe";
import type { Operator, Order, Participant, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { env } from "./env";
import { readAutomations } from "./automations";
import { sendWhatsAppMessage } from "./twilio";
import { sendOrderConfirmedEmail } from "./email";

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function formatEurosPrecise(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/**
 * Envoyée une fois le paiement confirmé — le reçu part toujours (transactionnel),
 * la demande d'avis est incluse dans le même email si l'opérateur l'a activée
 * et configuré un lien Google (voir §5 du brief : demandé après achat seulement).
 */
async function sendPostPurchaseMessages(
  participant: Participant,
  sortie: Sortie,
  operator: Operator,
  order: Order,
): Promise<void> {
  const flags = readAutomations(operator.automations);
  const includeReview = flags.reviewRequest && !!operator.googleReviewUrl && !participant.reviewRequestSentAt;

  if (participant.channel === "WHATSAPP") {
    if (!includeReview) return;
    const message = `Merci d'avoir choisi ${operator.name} ! Un avis Google prend 30 secondes et aide énormément : ${operator.googleReviewUrl}`;
    try {
      await sendWhatsAppMessage(participant.contact, message);
      await track("automation_review_sent", { operatorId: operator.id, participantId: participant.id });
    } catch (error) {
      console.error("[order-fulfillment] review WhatsApp failed:", error);
    } finally {
      await prisma.participant.update({ where: { id: participant.id }, data: { reviewRequestSentAt: new Date() } });
    }
    return;
  }

  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${participant.token}`;
  const freeSampleCount = await prisma.photo.count({
    where: { sortieId: sortie.id, ownerId: participant.id, isFreeSample: true },
  });
  const paidCount = order.photoIds.length;
  const paidLabel =
    paidCount === operator.packSize ? `Pack ${operator.packSize} photos` : `${paidCount} photo${paidCount > 1 ? "s" : ""}`;
  const packLabel = freeSampleCount > 0 ? `${paidLabel} + ${freeSampleCount} offerte${freeSampleCount > 1 ? "s" : ""}` : paidLabel;

  try {
    await sendOrderConfirmedEmail({
      to: participant.contact,
      operatorId: operator.id,
      operatorName: operator.name,
      photoCount: paidCount + freeSampleCount,
      downloadUrl: galleryUrl,
      packLabel,
      amountLabel: formatEurosPrecise(order.amountCents),
      orderRef: `SV-${order.id.slice(-6).toUpperCase()}`,
      orderDateLabel: formatDateFr(order.paidAt ?? new Date()),
      reviewUrl: includeReview ? operator.googleReviewUrl : null,
      supportUrl: galleryUrl,
    });
    await track("order_confirmed_sent", { operatorId: operator.id, participantId: participant.id });
    if (includeReview) {
      await track("automation_review_sent", { operatorId: operator.id, participantId: participant.id });
    }
  } catch (error) {
    console.error("[order-fulfillment] order confirmation email failed:", error);
  } finally {
    if (includeReview) {
      await prisma.participant.update({ where: { id: participant.id }, data: { reviewRequestSentAt: new Date() } });
    }
  }
}

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

  await sendPostPurchaseMessages(participant, participant.sortie, participant.sortie.operator, updated);
}
