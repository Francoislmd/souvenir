import { prisma } from "./prisma";
import { getPreviewUrl } from "./storage";
import { backfillGroupPreviews } from "./group-publish";

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

function formatDateFr(d: Date): string {
  return d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })
    .replace(/^./, (c) => c.toUpperCase());
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
 * Créneaux d'une sortie publiée, l'écran d'accueil de store.linktrip.co/{slug}/{code}.
 *
 * Le lien portait avant sur l'opérateur entier : il fallait donc d'abord
 * choisir son jour parmi 90 jours d'historique. Le code court désigne une
 * sortie et une seule, alors l'écran du jour disparaît et il ne reste que le
 * geste utile, choisir son créneau. Un même jour calendaire peut compter
 * plusieurs sorties chez le même opérateur : ce sont des boutiques
 * distinctes, avec des codes distincts, elles ne se voient pas entre elles.
 *
 * Renvoie null tant qu'aucun créneau n'existe (sortie pas encore publiée).
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

  const slots: GroupSlotSummary[] = sortie.slots.map((slot) => ({
    id: slot.id,
    label: slot.label,
    hourBucket: hourBucketFor(slot.startsAt),
    activity: sortie.activity,
    activityKey: slugify(sortie.activity),
    guide: slot.guide,
    photoCount: slot._count.photos,
  }));

  return { dateLabel: formatDateFr(sortie.startsAt).toLowerCase(), slots };
}

/**
 * Photos d'un créneau (écran galerie) — le client doit se reconnaître dans
 * le tas (brief §3), donc l'aperçu reste lisible : la protection tient au
 * nom répété sur une plaque à peine floutée (groupPreviewKey,
 * lib/group-watermark.ts). Aucune photo n'est offerte ni téléchargeable
 * avant paiement.
 *
 * Rattrapage : la génération du filigrane à la publication peut échouer
 * pour une poignée de photos (contention CPU, original pas encore répliqué
 * — voir lib/group-publish.ts). Plutôt que de les laisser sans aperçu pour
 * toujours, on retente ici, à chaque appel — cette route est sondée toutes
 * les 4s par GroupGallery tant qu'il manque un aperçu, ce qui fait
 * naturellement office de nouvelles tentatives.
 */
export async function getSlotPhotos(slotId: string, operatorName: string): Promise<GroupPhoto[]> {
  const photos = await prisma.photo.findMany({
    where: { slotId, hiddenAt: null, status: { not: "FAILED" } },
    orderBy: { createdAt: "asc" },
  });

  const missing = photos.filter((p) => !p.groupPreviewKey);
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
