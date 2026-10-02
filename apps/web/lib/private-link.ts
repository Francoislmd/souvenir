import type { Operator, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { env } from "./env";
import { sendGroupInviteEmail } from "./email";
import { buildEmailCover } from "./email-cover";

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
  });
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
    include: { operator: true, participants: { where: { sentAt: null, deletedAt: null, channel: "EMAIL" }, orderBy: { createdAt: "asc" } } },
  });
  if (!sortie || sortie.status !== "SENT" || sortie.participants.length === 0) return 0;

  const coverUrl = await buildEmailCover(sortie.id).catch(() => null);
  let sent = 0;
  for (const participant of sortie.participants) {
    try {
      await sendPrivateInvite(participant, sortie, coverUrl);
      sent += 1;
    } catch (error) {
      console.error("[private-link] pending invite failed for", participant.id, error);
    }
  }
  return sent;
}
