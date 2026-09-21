import type { Operator, Participant, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendWhatsAppMessage } from "./twilio";
import { sendPhotosReminderEmail, sendPhotosOfferEmail, sendGroupReminderEmail } from "./email";
import { buildEmailCover } from "./email-cover";
import { ensureShareCode, storeUrl } from "./store";
import { getPreviewUrl } from "./storage";
import { formatEuros } from "./format";
import { applyReducedOffer, REDUCED_OFFER_DISCOUNT_PERCENT } from "./pricing";
import { env } from "./env";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Relances de la boutique de groupe, comptées depuis l'envoi du lien
 * (Participant.sentAt) :
 * - 1re relance à J+2 : la plupart des achats se font dans les 48 h, celle-ci
 *   rattrape ceux qui ont oublié ;
 * - 2e et dernière à J+6 : elle tombe dans le week-end suivant.
 * Le cron est quotidien (18 h, heure de Paris l'été) : une marge de 6 h évite
 * qu'un lien envoyé à 19 h glisse d'un jour entier.
 */
export const GROUP_REMINDER_1_AFTER = 2 * DAY;
export const GROUP_REMINDER_2_AFTER = 6 * DAY;
const CRON_SLACK = 6 * HOUR;

// Plafond par passage. Le scan est quotidien et chaque participant coûte un
// envoi (Resend ou Twilio) en séquentiel : sans borne, la route finit par
// dépasser son maxDuration et s'arrête au milieu, sans qu'on sache où. Avec
// une borne, le reste est simplement repris au passage suivant — remindedAt
// et reducedOfferSentAt garantissent qu'on ne renvoie jamais deux fois.
const MAX_PER_SCAN = 500;

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

function formatTimeFr(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
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
    select: { blurEmailKey: true },
  });
  if (photos.length === 0) return { sent: false };
  // Jamais rien en clair dans l'email — uniquement le flou pré-généré côté
  // serveur, offerte ou payante (cette distinction est le rôle de la
  // boutique, pas de l'email).
  const hero = photos.find((p) => p.blurEmailKey);
  const heroUrl = hero?.blurEmailKey ? getPreviewUrl(hero.blurEmailKey) : null;

  try {
    await sendPhotosReminderEmail({
      to: participant.contact,
      token: participant.token,
      operatorId: operator.id,
      firstName: participant.name.split(/\s+/)[0] ?? participant.name,
      operatorName: operator.name,
      activity: sortie.activity,
      sortieDate: formatDateFr(sortie.startsAt),
      sortieTime: formatTimeFr(sortie.startsAt),
      sortiePlace: sortie.place,
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
    await sendWhatsAppMessage(participant.contact, `${participant.name.split(/\s+/)[0]}, vos photos sont à prix réduit pendant 48h : ${galleryUrl}`);
    return;
  }

  const photos = await prisma.photo.findMany({
    where: { sortieId: sortie.id, status: { not: "FAILED" }, OR: [{ ownerId: participant.id }, { ownerId: null }] },
    select: { blurEmailKey: true },
  });
  // Jamais thumbKey en repli : ce sont des photos payantes, non achetées —
  // seul le flou pré-généré peut apparaître, sinon on l'omet.
  const thumbUrls = photos
    .slice(0, 2)
    .map((p) => (p.blurEmailKey ? getPreviewUrl(p.blurEmailKey) : null))
    .filter((u): u is string => u !== null);

  const pricePromoCents = applyReducedOffer(operator.priceAllCents);

  await sendPhotosOfferEmail({
    to: participant.contact,
    token: participant.token,
    operatorId: operator.id,
    operatorName: operator.name,
    activity: sortie.activity,
    sortieDate: formatDateFr(sortie.startsAt),
    sortieTime: formatTimeFr(sortie.startsAt),
    sortiePlace: sortie.place,
    thumbUrls,
    discountPercent: REDUCED_OFFER_DISCOUNT_PERCENT,
    pricePromo: formatEuros(pricePromoCents),
    priceFull: formatEuros(operator.priceAllCents),
    offerDeadlineDay: expiresAt.toLocaleDateString("fr-FR", { weekday: "long" }),
    offerDeadlineLabel: `${expiresAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}, ${expiresAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    galleryUrl,
    unsubUrl: `${galleryUrl}/desinscription`,
  });
}

export interface AutomationScanResult {
  resent: number;
  offersSent: number;
  groupReminders: number;
}

function formatDayFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

/**
 * Relances GROUPE : adresses prévenues par l'opérateur (sentAt posé par
 * /api/sorties/[sortieId]/invite) qui n'ont pas payé. Aucune ouverture n'est
 * suivie en mode GROUPE (le lien est commun à tout le groupe) : seul le
 * paiement arrête les relances, avec la désinscription. Le paiement reprend
 * la ligne invitée (même adresse), donc un acheteur n'est plus relancé.
 */
async function runGroupReminderScan(now: Date): Promise<number> {
  let sent = 0;
  const unpaid = { OR: [{ order: null }, { order: { status: { notIn: ["succeeded", "refunded", "disputed"] } } }] };
  const liveSortie = { mode: "GROUPE" as const, purgeAt: { gt: now } };

  const due = await prisma.participant.findMany({
    where: {
      channel: "EMAIL",
      deletedAt: null,
      unsubscribedAt: null,
      finalRemindedAt: null,
      sortie: liveSortie,
      AND: [
        unpaid,
        // Les invitations d'avant cette mise en place ne sont pas relancées des semaines après.
        { sentAt: { gte: new Date(now.getTime() - 30 * DAY) } },
        {
          OR: [
            { remindedAt: null, sentAt: { lte: new Date(now.getTime() - GROUP_REMINDER_1_AFTER + CRON_SLACK) } },
            {
              remindedAt: { lte: new Date(now.getTime() - (GROUP_REMINDER_2_AFTER - GROUP_REMINDER_1_AFTER) + CRON_SLACK) },
              sentAt: { lte: new Date(now.getTime() - GROUP_REMINDER_2_AFTER + CRON_SLACK) },
            },
          ],
        },
      ],
    },
    include: { sortie: { include: { operator: true } } },
    orderBy: { sentAt: "asc" },
    take: MAX_PER_SCAN,
  });

  // Un bandeau et un lien par sortie, partagés par tous ses destinataires.
  const perSortie = new Map<string, { coverUrl: string | null; galleryUrl: string }>();

  for (const participant of due) {
    const { sortie } = participant;
    const operator = sortie.operator;
    if (!readAutomations(operator.automations).resendUnopened) continue;
    const step: 1 | 2 = participant.remindedAt ? 2 : 1;

    try {
      let shared = perSortie.get(sortie.id);
      if (!shared) {
        const code = await ensureShareCode(sortie);
        shared = { coverUrl: await buildEmailCover(sortie.id), galleryUrl: storeUrl(operator.slug, code) };
        perSortie.set(sortie.id, shared);
      }
      await sendGroupReminderEmail({
        step,
        to: participant.contact,
        token: participant.token,
        operatorId: operator.id,
        operatorName: operator.name,
        operatorLogoUrl: operator.logoUrl,
        brandColor: operator.brandColor,
        activity: sortie.activity,
        sortieDate: formatDayFr(sortie.startsAt),
        sortiePlace: sortie.place,
        galleryUrl: shared.galleryUrl,
        coverUrl: shared.coverUrl,
        purgeDate: sortie.purgeAt ? formatDayFr(sortie.purgeAt) : null,
      });
      await prisma.participant.update({
        where: { id: participant.id },
        data: step === 1 ? { remindedAt: now } : { finalRemindedAt: now },
      });
      await track("automation_group_reminder_sent", { operatorId: operator.id, participantId: participant.id, meta: { step } });
      sent += 1;
    } catch (error) {
      console.error("[automations] group reminder failed:", error);
    }
  }
  return sent;
}

export async function runAutomationScan(now: Date = new Date()): Promise<AutomationScanResult> {
  const result: AutomationScanResult = { resent: 0, offersSent: 0, groupReminders: 0 };

  // Mode GROUPE exclu des deux scans : depuis que l'envoi du lien crée une
  // ligne par adresse, ces participants ont un `sentAt` sans rien posséder en
  // propre. Les relances les enverraient vers /g/{token}, une galerie
  // individuelle qui n'est pas leur boutique.
  const unopened = await prisma.participant.findMany({
    where: {
      sortie: { mode: "INDIVIDUEL" },
      sentAt: { lte: new Date(now.getTime() - 2 * HOUR) },
      openedAt: null,
      remindedAt: null,
      deletedAt: null,
      unsubscribedAt: null,
    },
    include: { sortie: { include: { operator: true } } },
    orderBy: { sentAt: "asc" },
    take: MAX_PER_SCAN,
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
      sortie: { mode: "INDIVIDUEL" },
      openedAt: { lte: new Date(now.getTime() - 24 * HOUR) },
      reducedOfferSentAt: null,
      deletedAt: null,
      unsubscribedAt: null,
      OR: [{ order: null }, { order: { status: { notIn: ["succeeded", "refunded", "disputed"] } } }],
    },
    include: { sortie: { include: { operator: true } } },
    orderBy: { openedAt: "asc" },
    take: MAX_PER_SCAN,
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

  result.groupReminders = await runGroupReminderScan(now);

  return result;
}
