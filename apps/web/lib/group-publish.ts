import exifr from "exifr";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { supabaseAdmin } from "./supabase";
import { ORIGINALS_BUCKET } from "./storage";
import { clusterByTime, type ClusterItem } from "./cluster";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatSlotLabel(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
}

async function readTakenAt(originalKey: string): Promise<Date | null> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).download(originalKey);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    const exif = await exifr.parse(buffer, ["DateTimeOriginal"]).catch(() => null);
    const takenAt = exif?.DateTimeOriginal;
    return takenAt instanceof Date && !Number.isNaN(takenAt.getTime()) ? takenAt : null;
  } catch (error) {
    console.error(`[group-publish] EXIF read failed for ${originalKey}`, error);
    return null;
  }
}

/**
 * Publie une sortie GROUPE : lit l'EXIF de chaque original, regroupe les
 * photos par créneau (lib/cluster.ts), crée les Slot, marque la première
 * photo de chaque créneau comme offerte (photo de groupe), et publie le
 * lien. Tourne en ligne dans la requête (même modèle que
 * lib/photo-processing.ts — voir CLAUDE.md §2 : pas de worker séparé).
 */
export async function publishGroupSortie(sortieId: string): Promise<void> {
  const sortie = await prisma.sortie.findUniqueOrThrow({
    where: { id: sortieId },
    include: { photos: { where: { status: { not: "FAILED" } }, orderBy: { createdAt: "asc" } } },
  });
  if (sortie.mode !== "GROUPE") throw new Error("publishGroupSortie: sortie is not in GROUPE mode");

  const items: ClusterItem[] = await Promise.all(
    sortie.photos.map(async (photo) => ({ id: photo.id, takenAt: await readTakenAt(photo.originalKey) })),
  );
  const clusters = clusterByTime(items);

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
        await tx.photo.update({ where: { id: coverPhotoId }, data: { isFreeSample: true } });
        await tx.slot.update({ where: { id: slot.id }, data: { coverPhotoId } });
      }
    }

    // takenAt est renseigné sur chaque photo pour traçabilité, indépendamment du slot.
    await Promise.all(
      items
        .filter((i) => i.takenAt)
        .map((i) => tx.photo.update({ where: { id: i.id }, data: { takenAt: i.takenAt } })),
    );

    await tx.sortie.update({
      where: { id: sortie.id },
      data: { status: "SENT", purgeAt: new Date(sortie.startsAt.getTime() + 90 * DAY_MS) },
    });
  });

  await track("sortie_published", { operatorId: sortie.operatorId, meta: { sortieId: sortie.id, slots: clusters.length } });
}
