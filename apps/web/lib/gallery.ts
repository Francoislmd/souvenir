import { prisma } from "./prisma";
import { getPreviewUrl, getOriginalSignedUrl } from "./storage";
import type { BoutiquePhoto } from "@/components/gallery/BoutiqueGallery";

/**
 * Photos visibles par un participant (les siennes + les communes), quel que
 * soit leur état de traitement — pas seulement "READY". Le pro peut envoyer
 * avant que le worker ait fini, sinon la galerie du client apparaît vide ou
 * incomplète à l'ouverture du lien alors que les photos existent déjà.
 */
export async function getBoutiquePhotos(
  participant: { id: string; sortieId: string },
  purchasedSet: Set<string>,
): Promise<BoutiquePhoto[]> {
  const rawPhotos = await prisma.photo.findMany({
    where: {
      sortieId: participant.sortieId,
      status: { not: "FAILED" },
      OR: [{ ownerId: participant.id }, { ownerId: null }],
    },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    rawPhotos.map(async (p) => {
      const unlocked = p.isFreeSample || purchasedSet.has(p.id);
      // Verrouillée : on sert le JPEG flouté généré côté serveur (pixels réellement
      // flous), jamais l'aperçu net avec un filter CSS — récupérable en un clic.
      // Repli : si le worker n'a pas encore généré ce blurKey (déploiement en
      // retard, ou photo traitée avant l'ajout de cette étape), on sert l'aperçu
      // net mais le composant applique alors un flou CSS temporaire — imparfait,
      // mais mieux que de montrer la photo intacte.
      const lockedKey = p.blurKey ?? p.previewKey ?? p.thumbKey;
      const previewUrl = unlocked
        ? p.previewKey
          ? getPreviewUrl(p.previewKey)
          : p.thumbKey
            ? getPreviewUrl(p.thumbKey)
            : null
        : lockedKey
          ? getPreviewUrl(lockedKey)
          : null;
      return {
        id: p.id,
        previewUrl,
        previewIsBlurred: unlocked || !!p.blurKey,
        // Jamais d'original pour une photo non achetée et non offerte (critère d'acceptation #4).
        originalUrl: unlocked ? await getOriginalSignedUrl(p.originalKey) : null,
        isFreeSample: p.isFreeSample,
        isVideo: p.isVideo,
      };
    }),
  );
}
