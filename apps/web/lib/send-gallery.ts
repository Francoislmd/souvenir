import type { Operator, Participant, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendWhatsAppMessage } from "./twilio";
import { sendPhotosReadyEmail } from "./email";
import { getPreviewUrl } from "./storage";
import { env } from "./env";
import { renderGalleryMessage } from "./message-templates";

interface SendResult {
  sent: boolean;
  error?: string;
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export async function sendParticipantGallery(
  participant: Participant,
  sortie: Sortie,
  operator: Operator,
): Promise<SendResult> {
  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${participant.token}`;
  const message = renderGalleryMessage({ clientName: participant.name.split(/\s+/)[0] ?? "", operatorName: operator.name });

  const photos = await prisma.photo.findMany({
    where: {
      sortieId: sortie.id,
      status: "READY",
      OR: [{ ownerId: participant.id }, { ownerId: null }],
    },
    select: { thumbKey: true, previewKey: true, blurKey: true, isFreeSample: true },
  });

  try {
    if (participant.channel === "EMAIL") {
      const freeSamples = photos.filter((p) => p.isFreeSample);
      const paidPhotos = photos.filter((p) => !p.isFreeSample);

      const hero = freeSamples[0] ?? photos[0];
      const heroUrl = hero ? getPreviewUrl(hero.previewKey ?? hero.blurKey ?? hero.thumbKey ?? "") : null;
      const thumbUrls = paidPhotos
        .slice(0, 3)
        .map((p) => (p.blurKey ? getPreviewUrl(p.blurKey) : null))
        .filter((u): u is string => u !== null);

      if (heroUrl) {
        await sendPhotosReadyEmail({
          to: participant.contact,
          token: participant.token,
          operatorId: operator.id,
          firstName: participant.name.split(/\s+/)[0] ?? participant.name,
          operatorName: operator.name,
          operatorColor: operator.brandColor,
          sortieDate: formatDateFr(sortie.startsAt),
          sortiePlace: sortie.place,
          freeCount: freeSamples.length,
          paidCount: paidPhotos.length,
          heroUrl,
          thumbUrls,
          galleryUrl,
          deleteUrl: `${galleryUrl}/supprimer`,
          unsubUrl: `${galleryUrl}/desinscription`,
        });
      }
    } else {
      await sendWhatsAppMessage(participant.contact, `${message}\n${galleryUrl}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown error";
    console.error("[send-gallery] error:", msg);
    return { sent: false, error: msg };
  }

  await prisma.participant.update({ where: { id: participant.id }, data: { sentAt: new Date() } });
  await track("gallery_sent", { operatorId: operator.id, participantId: participant.id, meta: { channel: participant.channel } });

  return { sent: true };
}
