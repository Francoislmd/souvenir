import exifr from "exifr";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { supabaseAdmin } from "./supabase";
import { ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "./storage";
import { generateGroupPreview } from "./group-watermark";
import { clusterByTime, type ClusterItem } from "./cluster";

const DAY_MS = 24 * 60 * 60 * 1000;

// Toujours formaté en heure de Paris (le seul fuseau du marché actuel) :
// sans ça, l'heure affichée dépend du fuseau du serveur qui exécute la
// publication (souvent UTC en production) et ne correspond plus à l'heure
// que l'opérateur a saisie à la création de la sortie.
function formatSlotLabel(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
}

interface PhotoPrep {
  id: string;
  takenAt: Date | null;
  groupPreviewKey: string | null;
}

// Le filigrane tourne désormais un modèle de détection de visage (TF.js,
// backend CPU) en plus du rendu canvas — bien plus lourd en CPU/mémoire que
// l'ancien rendu SVG. Lancer une dizaine de préparations de front sur une
// même invocation (Promise.all sans limite) s'est déjà traduit par des
// aperçus silencieusement manquants sur une grosse sortie, sans la moindre
// erreur dans les logs — signe de contention plutôt que d'échec propre.
// On plafonne donc le nombre de photos traitées en parallèle.
const PREPARE_CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Un seul téléchargement de l'original par photo : sert à la fois à lire
 * l'EXIF (regroupement par créneau) et à générer l'aperçu filigrané de
 * galerie de groupe (lib/group-watermark.ts) — jamais servi flouté, la
 * protection tient entièrement au filigrane.
 */
async function preparePhotoOnce(photoId: string, originalKey: string, operatorName: string): Promise<PhotoPrep> {
  const { data, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).download(originalKey);
  if (error || !data) throw error ?? new Error("download returned no data");

  const buffer = Buffer.from(await data.arrayBuffer());

  const exif = await exifr.parse(buffer, ["DateTimeOriginal"]).catch(() => null);
  const takenAtRaw = exif?.DateTimeOriginal;
  const takenAt = takenAtRaw instanceof Date && !Number.isNaN(takenAtRaw.getTime()) ? takenAtRaw : null;

  const groupPreviewKey = `${photoId}/group-preview.jpg`;
  const previewBuffer = await generateGroupPreview(buffer, operatorName);
  await supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(groupPreviewKey, previewBuffer, { contentType: "image/jpeg", upsert: true });

  return { id: photoId, takenAt, groupPreviewKey };
}

/**
 * Un seul téléchargement de l'original par photo : sert à la fois à lire
 * l'EXIF (regroupement par créneau) et à générer l'aperçu filigrané de
 * galerie de groupe (lib/group-watermark.ts) — jamais servi flouté, la
 * protection tient entièrement au filigrane. Un essai supplémentaire avant
 * d'abandonner : le rendu du filigrane sollicite fortement le CPU (détection
 * de visage TF.js), un échec isolé sous contention mérite une deuxième
 * chance plutôt que de laisser la photo sans filigrane.
 */
async function preparePhoto(photoId: string, originalKey: string, operatorName: string): Promise<PhotoPrep> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await preparePhotoOnce(photoId, originalKey, operatorName);
    } catch (error) {
      if (attempt === 2) {
        console.error(`[group-publish] preparation failed for ${originalKey}`, error);
        return { id: photoId, takenAt: null, groupPreviewKey: null };
      }
      console.warn(`[group-publish] preparation attempt ${attempt} failed for ${originalKey}, retrying`, error);
    }
  }
  // Inatteignable (la boucle retourne toujours dans l'une des deux branches ci-dessus).
  return { id: photoId, takenAt: null, groupPreviewKey: null };
}

/**
 * Publie une sortie GROUPE : lit l'EXIF de chaque original, génère son
 * aperçu filigrané, regroupe les photos par créneau (lib/cluster.ts), crée
 * les Slot, désigne une couverture par créneau (juste une vignette de
 * repérage — pas une photo offerte, elle reste payante comme les autres),
 * et publie le lien. Tourne en ligne dans la requête (même modèle que
 * lib/photo-processing.ts — voir CLAUDE.md §2 : pas de worker séparé).
 */
export async function publishGroupSortie(sortieId: string): Promise<void> {
  const sortie = await prisma.sortie.findUniqueOrThrow({
    where: { id: sortieId },
    include: {
      operator: true,
      photos: { where: { status: { not: "FAILED" } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (sortie.mode !== "GROUPE") throw new Error("publishGroupSortie: sortie is not in GROUPE mode");

  const prepared = await mapWithConcurrency(sortie.photos, PREPARE_CONCURRENCY, (photo) =>
    preparePhoto(photo.id, photo.originalKey, sortie.operator.name),
  );
  const items: ClusterItem[] = prepared.map((p) => ({ id: p.id, takenAt: p.takenAt }));
  const clusters = clusterByTime(items, undefined, sortie.startsAt);

  await prisma.$transaction(async (tx) => {
    for (const cluster of clusters) {
      const slot = await tx.slot.create({
        data: {
          sortieId: sortie.id,
          label: formatSlotLabel(cluster.startsAt),
          startsAt: cluster.startsAt,
          guide: sortie.guide,
        },
      });

      await tx.photo.updateMany({ where: { id: { in: cluster.ids } }, data: { slotId: slot.id } });

      const [coverPhotoId] = cluster.ids;
      if (coverPhotoId) {
        await tx.slot.update({ where: { id: slot.id }, data: { coverPhotoId } });
      }
    }

    // takenAt et groupPreviewKey sont renseignés sur chaque photo, indépendamment du slot.
    await Promise.all(
      prepared
        .filter((p) => p.takenAt || p.groupPreviewKey)
        .map((p) => tx.photo.update({ where: { id: p.id }, data: { takenAt: p.takenAt, groupPreviewKey: p.groupPreviewKey } })),
    );

    await tx.sortie.update({
      where: { id: sortie.id },
      data: { status: "SENT", purgeAt: new Date(sortie.startsAt.getTime() + 90 * DAY_MS) },
    });
  });

  await track("sortie_published", { operatorId: sortie.operatorId, meta: { sortieId: sortie.id, slots: clusters.length } });
}
