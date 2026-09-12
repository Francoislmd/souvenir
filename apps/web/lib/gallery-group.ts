import { prisma } from "./prisma";
import { getPreviewUrl } from "./storage";
import { backfillGroupPreviews } from "./group-publish";
import { throttleBackfill } from "./preview-backfill";

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
  label: string; // heure de départ, "11 h 00"
  hourBucket: "morning" | "afternoon" | "evening";
  activity: string; // reprise de la sortie parente — un jour peut mélanger plusieurs activités
  activityKey: string; // slug stable pour le filtre
  guide: string | null;
  photoCount: number;
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

// La boutique n'affiche jamais que la fenêtre de rétention : au-delà, la purge
// a supprimé les photos et les créneaux (lib/gdpr.ts). 100 jours plutôt que
// 90 pour couvrir un cron passé et les bornes de journée.
const RETENTION_DAYS = 100;
// Garde-fou dur en plus du plancher de date : un très gros opérateur ne doit
// pas transformer l'ouverture de sa boutique en requête sans fond.
const MAX_SORTIES_PER_STORE = 400;

function retentionFloor(now: Date = new Date()): Date {
  return new Date(now.getTime() - RETENTION_DAYS * DAY_MS);
}

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

// Jamais de repli sur previewKey/thumbKey ici : ce sont des aperçus non (ou
// à peine) filigranés générés à l'upload pour la boutique individuelle — les
// servir en galerie de groupe exposerait une photo en clair avant achat
// (voir getSlotPhotos). Tant que groupPreviewKey n'est pas prêt, l'aperçu
// reste absent et le client patiente (GroupGallery sonde toutes les 4s).
function previewUrlFor(photo: { groupPreviewKey: string | null }): string | null {
  return photo.groupPreviewKey ? getPreviewUrl(photo.groupPreviewKey) : null;
}

/**
 * Jours publiés d'un opérateur, écran d'accueil de store.linktrip.co/{slug}.
 *
 * La boutique s'ouvre au nom de l'opérateur, sans secret : le slug est
 * lisible et devinable, c'est assumé. Une même date calendaire peut
 * correspondre à plusieurs sorties (activités ou horaires différents) :
 * elles sont regroupées sous une seule carte de jour, et tous leurs
 * créneaux se retrouvent à l'écran suivant. Seules les sorties déjà
 * publiées (des Slot existent) comptent, une sortie purgée après 90 jours
 * (plus aucun Slot) disparaît d'elle-même.
 */
export async function getOperatorGroupDays(slug: string): Promise<{ operatorId: string; operatorName: string; days: GroupDaySummary[] } | null> {
  const operator = await prisma.operator.findUnique({
    where: { slug },
    include: {
      sorties: {
        // Borné par la rétention : rien ne survit au-delà de 90 jours
        // (Sortie.purgeAt), la marge couvre un cron passé et la fin de
        // journée. Sans ce plancher, la boutique chargeait l'historique
        // complet d'un opérateur — toutes ses sorties, tous leurs créneaux et
        // un comptage de photos par créneau — à chaque ouverture, et la page
        // est en force-dynamic.
        where: { mode: "GROUPE", slots: { some: {} }, startsAt: { gte: retentionFloor() } },
        include: {
          slots: { select: { _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } } } },
        },
        orderBy: { startsAt: "desc" },
        take: MAX_SORTIES_PER_STORE,
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
export async function getSlotsForDate(slug: string, dateKey: string): Promise<{ dateLabel: string; slots: GroupSlotSummary[] } | null> {
  // Le filtre exact se fait plus bas, en heure de Paris, sur dateKeyFor() —
  // Postgres ne connaît pas ce fuseau ici. Mais la requête n'a aucune raison
  // de ramener autre chose que les deux jours qui encadrent celui demandé :
  // une fenêtre UTC de ±36 h contient à coup sûr le jour parisien visé, quel
  // que soit le décalage. Avant, elle chargeait toutes les sorties de
  // l'opérateur pour n'en garder qu'une poignée.
  const target = new Date(`${dateKey}T12:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const from = new Date(target.getTime() - 36 * 60 * 60 * 1000);
  const to = new Date(target.getTime() + 36 * 60 * 60 * 1000);

  const operator = await prisma.operator.findUnique({
    where: { slug },
    include: {
      sorties: {
        where: { mode: "GROUPE", slots: { some: {} }, startsAt: { gte: from, lte: to } },
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

  const slots: GroupSlotSummary[] = matching
    .flatMap((sortie) => sortie.slots.map((slot) => ({ slot, sortie })))
    .sort((a, b) => a.slot.startsAt.getTime() - b.slot.startsAt.getTime())
    .map(({ slot, sortie }) => ({
      id: slot.id,
      label: slot.label,
      hourBucket: hourBucketFor(slot.startsAt),
      activity: sortie.activity,
      activityKey: slugify(sortie.activity),
      guide: slot.guide,
      photoCount: slot._count.photos,
    }));

  return { dateLabel: formatDateFr(matching[0]!.startsAt).toLowerCase(), slots };
}

/**
 * Créneaux d'une seule sortie, pour le lien qui la désigne
 * (store.linktrip.co/{slug}/{code}).
 *
 * Distinct de getSlotsForDate : une même date calendaire peut porter
 * plusieurs sorties du même opérateur, et le lien d'une sortie ne doit
 * ouvrir que la sienne. Renvoie null tant qu'aucun créneau n'existe, c'est
 * à dire tant que la sortie n'est pas publiée.
 */
export async function getSortieSlots(sortieId: string): Promise<{ dateLabel: string; slots: GroupSlotSummary[] } | null> {
  const sortie = await prisma.sortie.findUnique({
    where: { id: sortieId },
    include: {
      slots: {
        include: { _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } } },
        orderBy: { startsAt: "asc" },
      },
    },
  });
  if (!sortie || sortie.slots.length === 0) return null;

  return {
    dateLabel: formatDateFr(sortie.startsAt).toLowerCase(),
    slots: sortie.slots.map((slot) => ({
      id: slot.id,
      label: slot.label,
      hourBucket: hourBucketFor(slot.startsAt),
      activity: sortie.activity,
      activityKey: slugify(sortie.activity),
      guide: slot.guide,
      photoCount: slot._count.photos,
    })),
  };
}

/**
 * Photos d'un créneau (écran galerie) — le client doit se reconnaître dans
 * le tas (brief §3), donc l'aperçu reste lisible : la protection tient au
 * nom répété sur une plaque à peine floutée (groupPreviewKey,
 * lib/group-watermark.ts). Aucune photo n'est offerte ni téléchargeable
 * avant paiement.
 *
 * Rattrapage : la génération du filigrane à la publication peut échouer
 * pour une poignée de photos (original pas encore répliqué côté stockage —
 * voir lib/group-publish.ts). Plutôt que de les laisser sans aperçu pour
 * toujours, on retente ici — mais au plus une fois par photo toutes les
 * 10 min (lib/preview-backfill.ts) : cette route est sondée toutes les 4 s
 * par GroupGallery, retenter à chaque appel relançait un rendu d'image en
 * boucle sur une route publique et non authentifiée.
 */
export async function getSlotPhotos(slotId: string, operatorName: string): Promise<GroupPhoto[]> {
  const photos = await prisma.photo.findMany({
    where: { slotId, hiddenAt: null, status: { not: "FAILED" } },
    orderBy: { createdAt: "asc" },
  });

  const missing = throttleBackfill(photos.filter((p) => !p.groupPreviewKey));
  const backfilled = await backfillGroupPreviews(
    missing.map((p) => ({ id: p.id, originalKey: p.originalKey })),
    operatorName,
  );

  return photos.map((p) => ({
    id: p.id,
    previewUrl: previewUrlFor({ groupPreviewKey: p.groupPreviewKey ?? backfilled.get(p.id) ?? null }),
    isVideo: p.isVideo,
  }));
}
