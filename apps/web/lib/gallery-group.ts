import { prisma } from "./prisma";
import { getPreviewUrl, getOriginalSignedUrl } from "./storage";

export interface GroupDaySummary {
  sortieId: string;
  activity: string;
  place: string | null;
  startsAt: Date;
  dateLabel: string; // "Mercredi 22 juillet"
  slotCount: number;
  coverUrl: string | null;
}

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

function formatDateFr(d: Date): string {
  return d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Jours publiés d'un opérateur (écran 1 de /g/s/[shareToken]) — un lien
 * unique par opérateur, réutilisé par toutes ses sorties GROUPE : le client
 * choisit d'abord son jour, puis son créneau (écran 2). Seules les sorties
 * déjà publiées (des Slot existent) apparaissent — une sortie purgée après
 * 90 jours (plus aucun Slot) disparaît d'elle-même.
 */
export async function getOperatorGroupDays(shareToken: string): Promise<{ operatorId: string; operatorName: string; days: GroupDaySummary[] } | null> {
  const operator = await prisma.operator.findUnique({
    where: { shareToken },
    include: {
      sorties: {
        where: { mode: "GROUPE", slots: { some: {} } },
        include: {
          slots: {
            include: { cover: true },
            orderBy: { startsAt: "asc" },
            take: 1,
          },
          _count: { select: { slots: true } },
        },
        orderBy: { startsAt: "desc" },
      },
    },
  });
  if (!operator) return null;

  return {
    operatorId: operator.id,
    operatorName: operator.name,
    days: operator.sorties.map((sortie) => {
      const cover = sortie.slots[0]?.cover ?? null;
      return {
        sortieId: sortie.id,
        activity: sortie.activity,
        place: sortie.place,
        startsAt: sortie.startsAt,
        dateLabel: formatDateFr(sortie.startsAt),
        slotCount: sortie._count.slots,
        coverUrl: cover?.previewKey ? getPreviewUrl(cover.previewKey) : cover?.thumbKey ? getPreviewUrl(cover.thumbKey) : null,
      };
    }),
  };
}

/**
 * Créneaux d'un jour (sortie) donné (écran 2) — aucune distinction
 * achetée/verrouillée à ce stade, juste de quoi choisir son créneau.
 */
export async function getSortieSlots(sortieId: string): Promise<{ activity: string; slots: GroupSlotSummary[] } | null> {
  const sortie = await prisma.sortie.findUnique({
    where: { id: sortieId },
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
 * Photos d'un créneau (écran 3) — jamais de flou : c'est la différence de
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
