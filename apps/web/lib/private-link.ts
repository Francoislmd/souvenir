import type { Operator, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { env } from "./env";
import { sendGroupInviteEmail } from "./email";
import { buildEmailCover } from "./email-cover";
import { getPreviewUrl } from "./storage";
import { visiblePhotoWhere } from "./access";
import { formatHourFr, photosOf } from "./format";
import { sendTextMessage } from "./twilio";

/**
 * Les départs d'une sortie de groupe qui ont des photos. À partir de deux,
 * chaque client doit être rattaché au sien par le prestataire avant de
 * recevoir son lien : comme un dossard, l'adresse mène à SES photos, et le
 * client ne choisit rien lui-même.
 */
export async function departuresWithPhotos(sortieId: string) {
  const slots = await prisma.slot.findMany({
    where: { sortieId },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } } },
  });
  return slots.filter((s) => s._count.photos > 0).map((s) => ({ id: s.id, startsAt: s.startsAt, photoCount: s._count.photos }));
}

/** Le lien peut partir : un seul départ (ou aucun encore), ou le sien est indiqué. */
export function departureKnown(participant: { slotId: string | null }, departureCount: number): boolean {
  return departureCount <= 1 || !!participant.slotId;
}

/**
 * Ce que le mail montre de la galerie d'un client : le nombre de photos de
 * son départ, quatre vignettes très floutées, et l'heure du départ.
 */
export async function galleryTeaser(participant: { id: string; sortieId: string; slotId: string | null }): Promise<{ photoCount: number; thumbs: string[]; detail: string | null }> {
  const where = visiblePhotoWhere(participant);
  const [photoCount, blurred, slot] = await Promise.all([
    prisma.photo.count({ where }),
    prisma.photo.findMany({ where: { ...where, blurEmailKey: { not: null } }, select: { blurEmailKey: true }, orderBy: [{ takenAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }], take: 4 }),
    participant.slotId ? prisma.slot.findUnique({ where: { id: participant.slotId }, select: { startsAt: true } }) : null,
  ]);
  return {
    photoCount,
    thumbs: blurred.map((p) => getPreviewUrl(p.blurEmailKey!)),
    detail: slot ? `départ ${formatHourFr(slot.startsAt)}` : null,
  };
}

/** La galerie privée d'un client : la seule adresse qui montre des photos. */
export function privateGalleryUrl(token: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/g/${token}`;
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

/**
 * Envoie à un client de sortie de groupe le lien de SA galerie, puis note
 * l'envoi. `sentAt` n'est posé qu'après l'envoi : une ligne sans date est
 * une adresse à qui rien n'est parti, et que la publication rattrapera.
 */
export async function sendPrivateInvite(
  participant: { id: string; token: string; contact: string },
  sortie: Sortie & { operator: Operator },
  coverUrl?: string | null,
): Promise<void> {
  const row = await prisma.participant.findUnique({ where: { id: participant.id }, select: { slotId: true } });
  const teaser = await galleryTeaser({ id: participant.id, sortieId: sortie.id, slotId: row?.slotId ?? null });
  if (!participant.contact.includes("@")) {
    // Un numéro de téléphone : le lien part par SMS (lib/twilio.ts).
    await sendTextMessage(
      participant.contact,
      `${sortie.operator.name} : vos photos ${photosOf(sortie.activity)} du ${formatDateFr(sortie.startsAt)} sont prêtes. Votre galerie privée, personnelle : ${privateGalleryUrl(participant.token)}`,
    );
  } else {
    await sendGroupInviteEmail({
      to: participant.contact,
      operatorId: sortie.operatorId,
      operatorName: sortie.operator.name,
      operatorLogoUrl: sortie.operator.logoUrl,
      brandColor: sortie.operator.brandColor,
      activity: sortie.activity,
      sortieDate: formatDateFr(sortie.startsAt),
      sortiePlace: sortie.place,
      galleryUrl: privateGalleryUrl(participant.token),
      coverUrl,
      purgeDate: sortie.purgeAt ? formatDateFr(sortie.purgeAt) : null,
      heroUrl: sortie.operator.coverUrl,
      detail: teaser.detail,
      thumbs: teaser.thumbs,
      photoCount: teaser.photoCount,
    });
  }
  await prisma.participant.update({ where: { id: participant.id }, data: { sentAt: new Date() } }).catch((error) => {
    console.error("[private-link] sentAt not recorded for", participant.id, error);
  });
}

/**
 * À la publication d'une sortie de groupe : les clients inscrits par le QR
 * code avant que les photos soient en ligne reçoivent enfin leur lien. Un
 * échec ne bloque pas les suivants ; l'adresse reste sans `sentAt`.
 */
export async function sendPendingInvites(sortieId: string): Promise<number> {
  const sortie = await prisma.sortie.findUnique({
    where: { id: sortieId },
    include: { operator: true, participants: { where: { sentAt: null, deletedAt: null }, orderBy: { createdAt: "asc" } } },
  });
  if (!sortie || sortie.status !== "SENT" || sortie.participants.length === 0) return 0;

  // Plusieurs départs : seuls les clients rattachés au leur reçoivent le lien.
  // Les autres le recevront quand le prestataire l'indiquera.
  const departures = await departuresWithPhotos(sortie.id);
  const ready = sortie.participants.filter((p) => departureKnown(p, departures.length));
  if (ready.length === 0) return 0;

  const coverUrl = await buildEmailCover(sortie.id).catch(() => null);
  let sent = 0;
  for (const participant of ready) {
    try {
      await sendPrivateInvite(participant, sortie, coverUrl);
      sent += 1;
    } catch (error) {
      console.error("[private-link] pending invite failed for", participant.id, error);
    }
  }
  return sent;
}
