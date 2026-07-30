import { prisma } from "./prisma";
import { getPreviewUrl, getOriginalSignedUrl } from "./storage";
import { backfillGroupPreviews } from "./group-publish";
import type { BoutiquePhoto } from "@/components/gallery/BoutiqueGallery";

/**
 * Photos visibles par un participant (les siennes + les communes), quel que
 * soit leur état de traitement — pas seulement "READY". Le pro peut envoyer
 * avant que le worker ait fini, sinon la galerie du client apparaît vide ou
 * incomplète à l'ouverture du lien alors que les photos existent déjà.
 */
export async function getBoutiquePhotos(
  participant: { id: string; sortieId: string; slotId?: string | null },
  purchasedSet: Set<string>,
  operatorName: string,
): Promise<BoutiquePhoto[]> {
  // Un Participant de mode GROUPE n'est jamais propriétaire d'une photo
  // (ownerId reste toujours null côté groupe) : il faut filtrer par slot,
  // sinon la requête ownerId-based renverrait toutes les photos de la
  // sortie, tous créneaux confondus.
  const rawPhotos = await prisma.photo.findMany({
    where: participant.slotId
      ? { slotId: participant.slotId, hiddenAt: null, status: { not: "FAILED" } }
      : {
          sortieId: participant.sortieId,
          status: { not: "FAILED" },
          OR: [{ ownerId: participant.id }, { ownerId: null }],
        },
    orderBy: { createdAt: "asc" },
  });

  // Rattrapage : processPhotoPreview (lib/photo-processing.ts) peut échouer à
  // générer groupPreviewKey pour une poignée de photos (même mécanisme que
  // lib/gallery-group.ts) ; cette route étant sondée toutes les 4s par
  // BoutiqueGallery tant qu'il manque un aperçu, on retente ici à chaque appel.
  const missing = rawPhotos.filter((p) => !p.groupPreviewKey && !p.isFreeSample && !purchasedSet.has(p.id));
  const backfilled = await backfillGroupPreviews(
    missing.map((p) => ({ id: p.id, originalKey: p.originalKey })),
    operatorName,
  );

  return Promise.all(
    rawPhotos.map(async (rawP) => {
      const p = backfilled.has(rawP.id) ? { ...rawP, groupPreviewKey: backfilled.get(rawP.id)! } : rawP;
      const unlocked = p.isFreeSample || purchasedSet.has(p.id);
      // Verrouillée : même filigrane tuilé qu'en mode GROUPE (Photo.groupPreviewKey,
      // lib/group-watermark.ts) — jamais de flou, et jamais de repli sur
      // previewKey/thumbKey (aperçus quasi nets) qui exposerait la photo avant
      // achat. Tant que groupPreviewKey n'est pas prêt, previewUrl reste absent ;
      // BoutiqueGallery sonde /api/g/[token]/photos toutes les 4s pour rattraper.
      const previewUrl = unlocked
        ? p.previewKey
          ? getPreviewUrl(p.previewKey)
          : p.thumbKey
            ? getPreviewUrl(p.thumbKey)
            : null
        : p.groupPreviewKey
          ? getPreviewUrl(p.groupPreviewKey)
          : null;
      return {
        id: p.id,
        previewUrl,
        // Jamais d'original pour une photo non achetée et non offerte (critère d'acceptation #4).
        originalUrl: unlocked ? await getOriginalSignedUrl(p.originalKey) : null,
        isFreeSample: p.isFreeSample,
        isVideo: p.isVideo,
      };
    }),
  );
}
