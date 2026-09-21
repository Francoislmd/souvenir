import sharp from "sharp";
import { prisma } from "./prisma";
import { PREVIEWS_BUCKET, downloadObject, getPreviewUrl, uploadObject } from "./storage";

/**
 * Bandeau de l'email d'invitation de groupe : une photo de la sortie, floutée
 * au point de ne laisser que les couleurs de la journée. On ne voit ni visage
 * ni personne, c'est une ambiance, pas un aperçu.
 *
 * Un seul fichier par sortie, dans `previews` (public), régénéré à chaque
 * envoi depuis la miniature (480 px) : quelques Ko, comme les autres dérivées
 * qui ne comptent pas dans Photo.sizeBytes. Supprimé avec la sortie par
 * purgeGroupSortie (lib/gdpr.ts).
 */
export function emailCoverKey(sortieId: string): string {
  return `sorties/${sortieId}/cover-email.jpg`;
}

export async function buildEmailCover(sortieId: string): Promise<string | null> {
  try {
    const photos = await prisma.photo.findMany({
      where: { sortieId, hiddenAt: null, status: "READY", isVideo: false, thumbKey: { not: null } },
      select: { thumbKey: true },
      orderBy: [{ takenAt: "asc" }, { createdAt: "asc" }],
      take: 400,
    });
    // Une photo du milieu de la journée : la première est souvent un test ou le briefing.
    const thumbKey = photos[Math.floor(photos.length / 2)]?.thumbKey;
    if (!thumbKey) return null;

    const source = await downloadObject(PREVIEWS_BUCKET, thumbKey);
    const cover = await sharp(source)
      .rotate()
      .resize(1024, 340, { fit: "cover" })
      .blur(36)
      .modulate({ saturation: 1.5, brightness: 1.04 })
      .jpeg({ quality: 74, progressive: true })
      .toBuffer();

    const key = emailCoverKey(sortieId);
    await uploadObject(PREVIEWS_BUCKET, key, cover, { contentType: "image/jpeg", cacheControl: "public, max-age=86400" });
    return getPreviewUrl(key);
  } catch (error) {
    // Sans bandeau, l'email reste complet : jamais de blocage de l'envoi pour une image.
    console.error("[email-cover]", sortieId, error);
    return null;
  }
}
