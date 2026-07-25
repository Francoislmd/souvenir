import { prisma } from "./prisma";
import { getPreviewUrl, getOriginalSignedUrl } from "./storage";

export interface GroupSlotSummary {
  id: string;
  label: string;
  startsAt: Date;
  guide: string | null;
  photoCount: number;
  coverUrl: string | null;
}

export interface GroupPhoto {
  id: string;
  previewUrl: string | null;
  // Uniquement pour la photo de groupe offerte (isFreeSample) — critère
  // d'acceptation #6 : gratuite ET téléchargeable, pas seulement visible.
  originalUrl: string | null;
  isFreeSample: boolean;
  isVideo: boolean;
}

/**
 * Créneaux d'une sortie GROUPE (écran 1 de /g/s/[shareToken]) — aucune
 * distinction achetée/verrouillée à ce stade, juste de quoi choisir son
 * créneau.
 */
export async function getGroupSlots(shareToken: string): Promise<{ sortieId: string; activity: string; slots: GroupSlotSummary[] } | null> {
  const sortie = await prisma.sortie.findUnique({
    where: { shareToken },
    include: {
      slots: {
        include: {
          cover: true,
          _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } },
        },
        orderBy: { startsAt: "asc" },
      },
    },
  });
  if (!sortie || sortie.mode !== "GROUPE") return null;

  return {
    sortieId: sortie.id,
    activity: sortie.activity,
    slots: sortie.slots.map((s) => ({
      id: s.id,
      label: s.label,
      startsAt: s.startsAt,
      guide: s.guide,
      photoCount: s._count.photos,
      coverUrl: s.cover?.previewKey ? getPreviewUrl(s.cover.previewKey) : s.cover?.thumbKey ? getPreviewUrl(s.cover.thumbKey) : null,
    })),
  };
}

/**
 * Photos d'un créneau (écran 2) — jamais de flou : c'est la différence de
 * fond avec la boutique individuelle (brief §3), le client doit se
 * reconnaître dans le tas. On sert systématiquement previewKey (déjà
 * filigrané côté serveur), jamais blurKey ni l'original avant paiement.
 */
export async function getSlotPhotos(slotId: string): Promise<GroupPhoto[]> {
  const photos = await prisma.photo.findMany({
    where: { slotId, hiddenAt: null, status: { not: "FAILED" } },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      previewUrl: p.previewKey ? getPreviewUrl(p.previewKey) : p.thumbKey ? getPreviewUrl(p.thumbKey) : null,
      originalUrl: p.isFreeSample ? await getOriginalSignedUrl(p.originalKey) : null,
      isFreeSample: p.isFreeSample,
      isVideo: p.isVideo,
    })),
  );
}
