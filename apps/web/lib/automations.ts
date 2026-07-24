import type { Operator, Participant, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendWhatsAppMessage } from "./twilio";
import { sendPhotosReminderEmail, sendPhotosOfferEmail } from "./email";
import { getPreviewUrl } from "./storage";
import { formatEuros } from "./format";
import { applyReducedOffer, REDUCED_OFFER_DISCOUNT_PERCENT } from "./pricing";
import { env } from "./env";

const HOUR = 60 * 60 * 1000;

interface AutomationFlags {
  resendUnopened: boolean;
  reducedPriceOffer: boolean;
  reviewRequest: boolean;
  referral: boolean;
}

export function readAutomations(automations: unknown): AutomationFlags {
  const a = (automations ?? {}) as Partial<AutomationFlags>;
  return {
    resendUnopened: a.resendUnopened ?? true,
    reducedPriceOffer: a.reducedPriceOffer ?? true,
    reviewRequest: a.reviewRequest ?? true,
    referral: false,
  };
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** Email 2 · relance à 2h — contenu distinct de la livraison (email 1), plus court. */
async function sendReminder(participant: Participant, sortie: Sortie, operator: Operator): Promise<{ sent: boolean }> {
  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${participant.token}`;

  if (participant.channel === "WHATSAPP") {
    try {
      await sendWhatsAppMessage(participant.contact, `${participant.name.split(/\s+/)[0]}, vos photos vous attendent : ${galleryUrl}`);
      return { sent: true };
    } catch (error) {
      console.error("[automations] reminder WhatsApp failed:", error);
      return { sent: false };
    }
  }

  const photos = await prisma.photo.findMany({
    where: { sortieId: sortie.id, status: { not: "FAILED" }, OR: [{ ownerId: participant.id }, { ownerId: null }] },
    select: { blurKey: true },
  });
  if (photos.length === 0) return { sent: false };
  // Jamais rien en clair dans l'email — uniquement le flou pré-généré côté
  // serveur, offerte ou payante (cette distinction est le rôle de la
  // boutique, pas de l'email).
  const hero = photos.find((p) => p.blurKey);
  const heroUrl = hero ? getPreviewUrl(hero.blurKey ?? "") : null;

  try {
    await sendPhotosReminderEmail({
      to: participant.contact,
      token: participant.token,
      operatorId: operator.id,
      firstName: participant.name.split(/\s+/)[0] ?? participant.name,
      operatorName: operator.name,
      sortieDate: formatDateFr(sortie.startsAt),
      heroUrl,
      photoCount: photos.length,
      galleryUrl,
      unsubUrl: `${galleryUrl}/desinscription`,
    });
    return { sent: true };
  } catch (error) {
    console.error("[automations] reminder email failed:", error);
    return { sent: false };
  }
}

/** Email 3 · offre à 24h — une seule fois, échéance réelle (voir reducedOfferExpiresAt). */
async function sendReducedOffer(participant: Participant, sortie: Sortie, operator: Operator, expiresAt: Date): Promise<void> {
  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${participant.token}`;

  if (participant.channel === "WHATSAPP") {
    await sendWhatsAppMessage(participant.contact, `${participant.name.split(/\s+/)[0]}, votre pack est à prix réduit pendant 48h : ${galleryUrl}`);
    return;
  }

  const photos = await prisma.photo.findMany({
    where: { sortieId: sortie.id, status: { not: "FAILED" }, isFreeSample: false, OR: [{ ownerId: participant.id }, { ownerId: null }] },
    select: { blurKey: true },
  });
  // Jamais thumbKey en repli : ce sont des photos payantes, non achetées —
  // seul le flou pré-généré (blurKey) peut apparaître, sinon on l'omet.
  const thumbUrls = photos
    .slice(0, 2)
    .map((p) => (p.blurKey ? getPreviewUrl(p.blurKey) : null))
    .filter((u): u is string => u !== null);

  const priceFullCents = operator.pricePackCents;
  const pricePromoCents = applyReducedOffer(priceFullCents);

  await sendPhotosOfferEmail({
    to: participant.contact,
    token: participant.token,
    operatorId: operator.id,
    operatorName: operator.name,
    sortieDate: formatDateFr(sortie.startsAt),
    thumbUrls,
    discountPercent: REDUCED_OFFER_DISCOUNT_PERCENT,
    pricePromo: formatEuros(pricePromoCents),
    priceFull: formatEuros(priceFullCents),
    offerDeadlineDay: expiresAt.toLocaleDateString("fr-FR", { weekday: "long" }),
    offerDeadlineLabel: `${expiresAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}, ${expiresAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    galleryUrl,
    unsubUrl: `${galleryUrl}/desinscription`,
  });
}

export interface AutomationScanResult {
  resent: number;
  offersSent: number;
}

export async function runAutomationScan(now: Date = new Date()): Promise<AutomationScanResult> {
  const result: AutomationScanResult = { resent: 0, offersSent: 0 };

  const unopened = await prisma.participant.findMany({
    where: {
      sentAt: { lte: new Date(now.getTime() - 2 * HOUR) },
      openedAt: null,
      remindedAt: null,
      deletedAt: null,
      unsubscribedAt: null,
    },
    include: { sortie: { include: { operator: true } } },
  });
  for (const participant of unopened) {
    const operator = participant.sortie.operator;
    if (!readAutomations(operator.automations).resendUnopened) continue;
    const sendResult = await sendReminder(participant, participant.sortie, operator);
    if (sendResult.sent) {
      await prisma.participant.update({ where: { id: participant.id }, data: { remindedAt: now } });
      await track("automation_resend_sent", { operatorId: operator.id, participantId: participant.id });
      result.resent += 1;
    }
  }

  const openedNoPurchase = await prisma.participant.findMany({
    where: {
      openedAt: { lte: new Date(now.getTime() - 24 * HOUR) },
      reducedOfferSentAt: null,
      deletedAt: null,
      unsubscribedAt: null,
      OR: [{ order: null }, { order: { status: { not: "succeeded" } } }],
    },
    include: { sortie: { include: { operator: true } } },
  });
  for (const participant of openedNoPurchase) {
    const operator = participant.sortie.operator;
    if (!readAutomations(operator.automations).reducedPriceOffer) continue;
    const expiresAt = new Date(now.getTime() + 48 * HOUR);
    try {
      await sendReducedOffer(participant, participant.sortie, operator, expiresAt);
      await prisma.participant.update({
        where: { id: participant.id },
        data: { reducedOfferSentAt: now, reducedOfferExpiresAt: expiresAt },
      });
      await track("automation_offer_sent", { operatorId: operator.id, participantId: participant.id });
      result.offersSent += 1;
    } catch (error) {
      console.error("[automations] reduced offer failed:", error);
    }
  }

  return result;
}
