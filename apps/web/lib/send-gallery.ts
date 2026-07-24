import type { Operator, Participant, Sortie } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendWhatsAppMessage } from "./twilio";
import { sendGalleryEmail } from "./email";
import { getPreviewUrl } from "./storage";
import { env } from "./env";
import { renderGalleryMessage } from "./message-templates";

interface SendResult {
  sent: boolean;
  error?: string;
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
    select: { thumbKey: true },
  });

  try {
    if (participant.channel === "EMAIL") {
      const thumbUrls = photos
        .slice(0, 4)
        .map((p) => (p.thumbKey ? getPreviewUrl(p.thumbKey) : null))
        .filter((u): u is string => u !== null);

      await sendGalleryEmail({
        to: participant.contact,
        operatorName: operator.name,
        logoUrl: operator.logoUrl,
        activity: sortie.activity,
        place: sortie.place,
        clientName: participant.name,
        photoCount: photos.length,
        thumbUrls,
        galleryUrl,
      });
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
