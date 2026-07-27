import { prisma } from "./prisma";
import { getPreviewUrl } from "./storage";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GroupDaySummary {
  dateKey: string; // clé stable pour l'écran suivant, ex. "2026-07-25"
  weekday: string; // "Dimanche"
  monthAbbr: string; // "JUIL"
  dayNumber: string; // "26"
  dateLabel: string; // "dimanche 26 juillet" — pour le fragment en dégradé du H1
  recency: "today" | "yesterday" | "week" | "earlier";
  sessionCount: number;
  photoCount: number;
}

export interface GroupSlotSummary {
  id: string;
  label: string; // heure, "11 h 00"
  hourBucket: "morning" | "afternoon" | "evening";
  activity: string; // reprise de la sortie parente — un jour peut mélanger plusieurs activités
  activityKey: string; // slug stable pour le filtre
  guide: string | null;
  photoCount: number;
  // Désambiguïsation des départs à la même minute (brief §11) — null hors
  // collision. Faute d'un champ dédié "taille de groupe" dans le modèle, le
  // seul signal disponible est le volume de photos.
  groupSizeLabel: string | null;
}

export interface GroupPhoto {
  id: string;
  previewUrl: string | null;
  isVideo: boolean;
}

// Pas de fuseau horaire par opérateur dans le modèle actuel — tout le
// regroupement (jour, matin/après-midi/soir, aujourd'hui/hier) se fait en
// heure de Paris (seul fuseau du marché actuel), de façon cohérente avec
// `formatSlotLabel` (lib/group-publish.ts) qui affiche le libellé du
// créneau dans le même fuseau. Les deux doivent rester alignés : un
// créneau affiché "19 h 30" doit tomber dans le bucket "evening" et sous
// le bon jour calendaire, quel que soit le fuseau du serveur qui exécute
// le code (souvent UTC en production).
const TZ = "Europe/Paris";

function formatDateFr(d: Date): string {
  return d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })
    .replace(/^./, (c) => c.toUpperCase());
}

function frWeekday(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", timeZone: TZ }).replace(/^./, (c) => c.toUpperCase());
}

function frMonthAbbr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "short", timeZone: TZ }).replace(".", "").toUpperCase();
}

function dateKeyFor(d: Date): string {
  // Format "en-CA" = YYYY-MM-DD, dans le fuseau de Paris plutôt qu'UTC.
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

function dayNumberFor(d: Date): string {
  return d.toLocaleDateString("en-US", { day: "numeric", timeZone: TZ });
}

function hourBucketFor(d: Date): "morning" | "afternoon" | "evening" {
  const h = Number(d.toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TZ }));
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
          slots: { select: { _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } } } },
        },
        orderBy: { startsAt: "desc" },
      },
    },
  });
  if (!operator) return null;

  const now = new Date();
  const todayKey = dateKeyFor(now);
  const yesterdayKey = dateKeyFor(new Date(now.getTime() - DAY_MS));
  const weekAgoKey = dateKeyFor(new Date(now.getTime() - 7 * DAY_MS));

  const byDate = new Map<string, { startsAt: Date; sessionCount: number; photoCount: number }>();
  for (const sortie of operator.sorties) {
    const key = dateKeyFor(sortie.startsAt);
    const sessionCount = sortie.slots.length;
    const photoCount = sortie.slots.reduce((sum, s) => sum + s._count.photos, 0);
    const existing = byDate.get(key);
    if (existing) {
      existing.sessionCount += sessionCount;
      existing.photoCount += photoCount;
    } else {
      byDate.set(key, { startsAt: sortie.startsAt, sessionCount, photoCount });
    }
  }

  const days = Array.from(byDate.entries())
    .sort((a, b) => b[1].startsAt.getTime() - a[1].startsAt.getTime())
    .map(([dateKey, d]) => ({
      dateKey,
      weekday: frWeekday(d.startsAt),
      monthAbbr: frMonthAbbr(d.startsAt),
      dayNumber: dayNumberFor(d.startsAt),
      dateLabel: formatDateFr(d.startsAt).toLowerCase(),
      recency: (dateKey === todayKey ? "today" : dateKey === yesterdayKey ? "yesterday" : dateKey >= weekAgoKey ? "week" : "earlier") as GroupDaySummary["recency"],
      sessionCount: d.sessionCount,
      photoCount: d.photoCount,
    }));

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
            include: { _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } } },
            orderBy: { startsAt: "asc" },
          },
        },
      },
    },
  });
  if (!operator) return null;

  const matching = operator.sorties.filter((sortie) => dateKeyFor(sortie.startsAt) === dateKey);
  if (matching.length === 0) return null;

  const raw = matching
    .flatMap((sortie) =>
      sortie.slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        startsAtMs: slot.startsAt.getTime(),
        hourBucket: hourBucketFor(slot.startsAt),
        activity: sortie.activity,
        activityKey: slugify(sortie.activity),
        guide: slot.guide,
        photoCount: slot._count.photos,
      })),
    )
    .sort((a, b) => a.startsAtMs - b.startsAtMs);

  const byStart = new Map<number, typeof raw>();
  for (const s of raw) byStart.set(s.startsAtMs, [...(byStart.get(s.startsAtMs) ?? []), s]);

  const slots: GroupSlotSummary[] = raw.map((s) => {
    const collisionGroup = byStart.get(s.startsAtMs)!;
    const groupSizeLabel =
      collisionGroup.length < 2
        ? null
        : s.id === [...collisionGroup].sort((a, b) => b.photoCount - a.photoCount)[0]!.id
          ? "grand groupe"
          : "petit groupe";
    return {
      id: s.id,
      label: s.label,
      hourBucket: s.hourBucket,
      activity: s.activity,
      activityKey: s.activityKey,
      guide: s.guide,
      photoCount: s.photoCount,
      groupSizeLabel,
    };
  });

  return { dateLabel: formatDateFr(matching[0]!.startsAt).toLowerCase(), slots };
}

/**
 * Photos d'un créneau (écran galerie) — jamais de flou : c'est la
 * différence de fond avec la boutique individuelle (brief §3), le client
 * doit se reconnaître dans le tas. La protection tient au filigrane tuilé
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
