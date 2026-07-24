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

  // Pas seulement "READY" : le pro peut envoyer avant que le worker ait fini
  // de traiter toutes les photos (voir PhotosFlow — le tri ne bloque plus sur
  // le traitement serveur). Le compte et l'email doivent refléter tout ce qui
  // est réellement assigné, pas seulement ce qui a déjà une miniature.
  const photos = await prisma.photo.findMany({
    where: {
      sortieId: sortie.id,
      status: { not: "FAILED" },
      OR: [{ ownerId: participant.id }, { ownerId: null }],
    },
    select: { blurKey: true },
  });

  try {
    if (participant.channel === "EMAIL") {
      // L'email ne montre jamais rien en clair — uniquement le flou
      // pré-généré côté serveur (blurKey), qu'il s'agisse d'une photo
      // offerte ou payante (ce n'est pas à l'email de faire cette
      // distinction, c'est le rôle de la boutique). Peut rester null si
      // rien n'est encore traité — l'email part quand même.
      const withBlur = photos.filter((p) => p.blurKey);
      const heroUrl = withBlur[0] ? getPreviewUrl(withBlur[0].blurKey ?? "") : null;
      const thumbUrls = withBlur.slice(1, 4).map((p) => getPreviewUrl(p.blurKey ?? ""));

      await sendPhotosReadyEmail({
        to: participant.contact,
        token: participant.token,
        operatorId: operator.id,
        firstName: participant.name.split(/\s+/)[0] ?? participant.name,
        operatorName: operator.name,
        operatorColor: operator.brandColor,
        sortieDate: formatDateFr(sortie.startsAt),
        sortiePlace: sortie.place,
        photoCount: photos.length,
        heroUrl,
        thumbUrls,
        galleryUrl,
        deleteUrl: `${galleryUrl}/supprimer`,
        unsubUrl: `${galleryUrl}/desinscription`,
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
