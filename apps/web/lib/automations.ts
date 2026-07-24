import type { Operator, Participant } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendWhatsAppMessage } from "./twilio";
import { sendReviewRequestEmail } from "./email";
import { sendParticipantGallery } from "./send-gallery";
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

export async function sendReviewRequest(participant: Participant, operator: Operator): Promise<void> {
  if (participant.reviewRequestSentAt) return;
  const flags = readAutomations(operator.automations);
  if (!flags.reviewRequest || !operator.googleReviewUrl) return;

  const message = `Merci d'avoir choisi ${operator.name} ! Un avis Google prend 30 secondes et aide énormément : ${operator.googleReviewUrl}`;

  try {
    if (participant.channel === "WHATSAPP") {
      await sendWhatsAppMessage(participant.contact, message);
    } else {
      await sendReviewRequestEmail({ to: participant.contact, operatorName: operator.name, reviewUrl: operator.googleReviewUrl, clientName: participant.name });
    }
    await track("automation_review_sent", { operatorId: operator.id, participantId: participant.id });
  } catch (error) {
    console.error("[automations] review request failed:", error);
  } finally {
    await prisma.participant.update({ where: { id: participant.id }, data: { reviewRequestSentAt: new Date() } });
  }
}

async function sendReducedOffer(participant: Participant, operator: Operator): Promise<void> {
  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${participant.token}`;
  const message = `${participant.name.split(/\s+/)[0]}, votre pack est à prix réduit pendant 48h : ${galleryUrl}`;
  if (participant.channel === "WHATSAPP") {
    await sendWhatsAppMessage(participant.contact, message);
  } else {
    await sendReviewRequestEmail({
      to: participant.contact,
      operatorName: operator.name,
      reviewUrl: galleryUrl,
      clientName: participant.name,
    });
  }
}

export interface AutomationScanResult {
  resent: number;
  offersSent: number;
}

export async function runAutomationScan(now: Date = new Date()): Promise<AutomationScanResult> {
  const result: AutomationScanResult = { resent: 0, offersSent: 0 };

  const unopened = await prisma.participant.findMany({
    where: { sentAt: { lte: new Date(now.getTime() - 2 * HOUR) }, openedAt: null, remindedAt: null, deletedAt: null },
    include: { sortie: { include: { operator: true } } },
  });
  for (const participant of unopened) {
    const operator = participant.sortie.operator;
    if (!readAutomations(operator.automations).resendUnopened) continue;
    const sendResult = await sendParticipantGallery(participant, participant.sortie, operator);
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
      OR: [{ order: null }, { order: { status: { not: "succeeded" } } }],
    },
    include: { sortie: { include: { operator: true } } },
  });
  for (const participant of openedNoPurchase) {
    const operator = participant.sortie.operator;
    if (!readAutomations(operator.automations).reducedPriceOffer) continue;
    try {
      await sendReducedOffer(participant, operator);
      await prisma.participant.update({
        where: { id: participant.id },
        data: { reducedOfferSentAt: now, reducedOfferExpiresAt: new Date(now.getTime() + 48 * HOUR) },
      });
      await track("automation_offer_sent", { operatorId: operator.id, participantId: participant.id });
      result.offersSent += 1;
    } catch (error) {
      console.error("[automations] reduced offer failed:", error);
    }
  }

  return result;
}
