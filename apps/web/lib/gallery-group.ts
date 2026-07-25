import { prisma } from "./prisma";
import { getPreviewUrl } from "./storage";

export interface GroupDaySummary {
  dateKey: string; // clé stable pour l'écran suivant, ex. "2026-07-25"
  dateLabel: string; // "Samedi 25 juillet"
  slotCount: number;
  coverUrl: string | null;
}

export interface GroupSlotSummary {
  id: string;
  label: string; // heure, "11 h 00"
  startsAt: Date;
  activity: string; // reprise de la sortie parente — un jour peut mélanger plusieurs activités
  guide: string | null;
  photoCount: number;
  coverUrl: string | null;
}

export interface GroupPhoto {
  id: string;
  previewUrl: string | null;
  isVideo: boolean;
}

function formatDateFr(d: Date): string {
  return d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^./, (c) => c.toUpperCase());
}

function dateKeyFor(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function previewUrlFor(photo: { groupPreviewKey: string | null; previewKey: string | null; thumbKey: string | null }): string | null {
  const key = photo.groupPreviewKey ?? photo.previewKey ?? photo.thumbKey;
  return key ? getPreviewUrl(key) : null;
}

/**
 * Jours publiés d'un opérateur (écran 1 de /g/s/[shareToken]) — un lien
 * unique par opérateur, réutilisé par toutes ses sorties GROUPE. Une même
 * date calendaire peut correspondre à plusieurs sorties (activités ou
 * horaires différents) : elles sont regroupées sous une seule carte de
 * jour, et tous leurs créneaux se retrouvent à l'écran suivant (écran 2).
 * Seules les sorties déjà publiées (des Slot existent) comptent — une
 * sortie purgée après 90 jours (plus aucun Slot) disparaît d'elle-même.
 */
export async function getOperatorGroupDays(shareToken: string): Promise<{ operatorId: string; operatorName: string; days: GroupDaySummary[] } | null> {
  const operator = await prisma.operator.findUnique({
    where: { shareToken },
    include: {
      sorties: {
        where: { mode: "GROUPE", slots: { some: {} } },
        include: {
          slots: { include: { cover: true }, orderBy: { startsAt: "asc" } },
        },
        orderBy: { startsAt: "desc" },
      },
    },
  });
  if (!operator) return null;

  const byDate = new Map<string, { dateLabel: string; startsAt: Date; slotCount: number; coverUrl: string | null }>();
  for (const sortie of operator.sorties) {
    const key = dateKeyFor(sortie.startsAt);
    const cover = sortie.slots[0]?.cover ?? null;
    const existing = byDate.get(key);
    if (existing) {
      existing.slotCount += sortie.slots.length;
      if (!existing.coverUrl && cover) existing.coverUrl = previewUrlFor(cover);
    } else {
      byDate.set(key, {
        dateLabel: formatDateFr(sortie.startsAt),
        startsAt: sortie.startsAt,
        slotCount: sortie.slots.length,
        coverUrl: cover ? previewUrlFor(cover) : null,
      });
    }
  }

  const days = Array.from(byDate.entries())
    .sort((a, b) => b[1].startsAt.getTime() - a[1].startsAt.getTime())
    .map(([dateKey, d]) => ({ dateKey, dateLabel: d.dateLabel, slotCount: d.slotCount, coverUrl: d.coverUrl }));

  return { operatorId: operator.id, operatorName: operator.name, days };
}

/**
 * Créneaux d'un jour donné (écran 2), tous services confondus — aucune
 * distinction achetée/verrouillée à ce stade, juste de quoi choisir son
 * créneau. Chaque créneau porte l'activité de sa sortie d'origine, un même
 * jour pouvant mélanger plusieurs activités.
 */
export async function getSlotsForDate(shareToken: string, dateKey: string): Promise<{ dateLabel: string; slots: GroupSlotSummary[] } | null> {
  const operator = await prisma.operator.findUnique({
    where: { shareToken },
    include: {
      sorties: {
        where: { mode: "GROUPE", slots: { some: {} } },
        include: {
          slots: {
            include: {
              cover: true,
              _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } },
            },
            orderBy: { startsAt: "asc" },
          },
        },
      },
    },
  });
  if (!operator) return null;

  const matching = operator.sorties.filter((sortie) => dateKeyFor(sortie.startsAt) === dateKey);
  if (matching.length === 0) return null;

  const slots = matching
    .flatMap((sortie) =>
      sortie.slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        startsAt: slot.startsAt,
        activity: sortie.activity,
        guide: slot.guide,
        photoCount: slot._count.photos,
        coverUrl: slot.cover ? previewUrlFor(slot.cover) : null,
      })),
    )
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return { dateLabel: formatDateFr(matching[0]!.startsAt), slots };
}

/**
 * Photos d'un créneau (écran 3) — jamais de flou : c'est la différence de
 * fond avec la boutique individuelle (brief §3), le client doit se
 * reconnaître dans le tas. La protection tient au filigrane tuilé
 * (groupPreviewKey, lib/group-watermark.ts) plutôt qu'à un flou — aucune
 * photo n'est offerte ni téléchargeable avant paiement.
 */
export async function getSlotPhotos(slotId: string): Promise<GroupPhoto[]> {
  const photos = await prisma.photo.findMany({
    where: { slotId, hiddenAt: null, status: { not: "FAILED" } },
    orderBy: { createdAt: "asc" },
  });

  return photos.map((p) => ({
    id: p.id,
    previewUrl: previewUrlFor(p),
    isVideo: p.isVideo,
  }));
}
