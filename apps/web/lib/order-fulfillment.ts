import type Stripe from "stripe";
import type { Operator, Order, Participant, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { env } from "./env";
import { readAutomations } from "./automations";
import { sendWhatsAppMessage } from "./twilio";
import { sendOrderConfirmedEmail } from "./email";
import { cardLabelOf } from "./receipt";
import { CGV_DATE_LABEL, sellerFromOperator, sellerLine } from "./seller-format";

/** « samedi 26 septembre » : le jour de la sortie, sur la ligne du reçu. */
function formatDayFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

/** « 29/09/2026 » : la date du paiement. */
function formatShortDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
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
  intent: Stripe.PaymentIntent,
): Promise<void> {
  const flags = readAutomations(operator.automations);
  const includeReview = flags.reviewRequest && !!operator.googleReviewUrl && !participant.reviewRequestSentAt;

  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${participant.token}`;
  const cgvUrl = `${env.NEXT_PUBLIC_APP_URL}/cgv`;
  // Plus d'échantillon offert depuis que toutes les photos sont filigranées
  // tant qu'elles ne sont pas payées : le reçu ne compte donc que le payé.
  const paidCount = order.photoIds.length;
  const countLabel = `${paidCount} photo${paidCount > 1 ? "s" : ""}`;
  const orderLabel = `${sortie.activity}, ${formatDayFr(sortie.startsAt)} · ${countLabel}`;
  const amountLabel = formatEurosPrecise(order.amountCents);
  const orderRef = `SV-${order.id.slice(-6).toUpperCase()}`;
  const orderDateLabel = formatShortDateFr(order.paidAt ?? new Date());
  const seller = sellerFromOperator(operator);

  // Le reçu part toujours, par le canal du client : c'est la confirmation
  // écrite du contrat qu'exige le Code de la consommation (L221-13). Un
  // client contacté par WhatsApp ne recevait jusqu'ici rien après paiement.
  if (participant.channel === "WHATSAPP") {
    try {
      const admin = await prisma.user.findFirst({ where: { operatorId: operator.id, role: "ADMIN" }, orderBy: { createdAt: "asc" } });
      const firstName = participant.name.split(/\s+/)[0] ?? "";
      const receipt = [
        `Merci${firstName ? ` ${firstName}` : ""}, votre paiement est confirmé.`,
        `${countLabel} · ${amountLabel}\nCommande ${orderRef} · ${orderDateLabel}`,
        galleryUrl,
        `Vendeur : ${sellerLine(seller)}. Livraison immédiate demandée : droit de rétractation non applicable.`,
        `${admin ? `Une photo défectueuse ? Écrivez au vendeur : ${admin.email}. ` : ""}Conditions de vente : ${cgvUrl}`,
      ].join("\n\n");
      await sendWhatsAppMessage(participant.contact, receipt);
      await track("order_confirmed_sent", { operatorId: operator.id, participantId: participant.id });
    } catch (error) {
      console.error("[order-fulfillment] receipt WhatsApp failed:", error);
    }

    if (!includeReview) return;
    const message = `Merci d'avoir choisi ${operator.name}. Un avis Google prend trente secondes et change beaucoup pour une petite structure : ${operator.googleReviewUrl}`;
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

  try {
    await sendOrderConfirmedEmail({
      to: participant.contact,
      operatorId: operator.id,
      operatorName: operator.name,
      photoCount: paidCount,
      downloadUrl: galleryUrl,
      orderLabel,
      amountLabel,
      orderRef,
      orderDateLabel,
      cardLabel: await cardLabelOf(intent, operator.stripeAccountId),
      sellerLine: sellerLine(seller),
      cgvUrl,
      cgvDateLabel: CGV_DATE_LABEL,
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

  await sendPostPurchaseMessages(participant, participant.sortie, participant.sortie.operator, updated, intent);
}
