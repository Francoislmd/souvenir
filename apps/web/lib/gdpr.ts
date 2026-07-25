import { prisma } from "./prisma";
import { track } from "./analytics";
import { deleteStorageObjects, ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "./storage";

export async function purgeParticipant(participantId: string): Promise<void> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { photos: true, sortie: true },
  });
  if (!participant || participant.deletedAt) return;

  const originalKeys = participant.photos.map((p) => p.originalKey);
  const previewKeys = participant.photos.flatMap((p) => [p.previewKey, p.thumbKey].filter((k): k is string => !!k));

  await deleteStorageObjects(ORIGINALS_BUCKET, originalKeys);
  await deleteStorageObjects(PREVIEWS_BUCKET, previewKeys);
  await prisma.photo.deleteMany({ where: { ownerId: participant.id } });

  await prisma.participant.update({
    where: { id: participant.id },
    data: { name: "Supprimé", contact: "", deleteAt: new Date(0), deletedAt: new Date() },
  });

  await track("gdpr_deletion", { operatorId: participant.sortie.operatorId, participantId: participant.id });
}

export async function runGdprPurgeScan(now: Date = new Date()): Promise<{ purged: number }> {
  const due = await prisma.participant.findMany({
    where: { deleteAt: { lte: now }, deletedAt: null },
    select: { id: true },
  });

  for (const p of due) {
    await purgeParticipant(p.id);
  }

  return { purged: due.length };
}

/**
 * Purge des galeries GROUPE (brief §5 : conservation 90 jours). Les photos
 * d'un Slot n'appartiennent à personne (ownerId reste null) — elles ne sont
 * donc jamais supprimées par purgeParticipant, qui ne cible que les photos
 * possédées en propre. Ici on supprime tout le lot d'un coup, à l'échelle
 * de la sortie (un jour) — le lien de partage vit sur l'Operator et sert
 * d'autres sorties, on n'y touche pas ; ce jour disparaît simplement de la
 * liste (getOperatorGroupDays ne montre que les sorties avec des Slot).
 */
export async function purgeGroupSortie(sortieId: string): Promise<void> {
  const sortie = await prisma.sortie.findUnique({
    where: { id: sortieId },
    include: { photos: true },
  });
  if (!sortie || sortie.mode !== "GROUPE" || !sortie.purgeAt) return;

  const originalKeys = sortie.photos.map((p) => p.originalKey);
  const previewKeys = sortie.photos.flatMap((p) =>
    [p.previewKey, p.thumbKey, p.blurKey, p.blurEmailKey, p.groupPreviewKey].filter((k): k is string => !!k),
  );

  await deleteStorageObjects(ORIGINALS_BUCKET, originalKeys);
  await deleteStorageObjects(PREVIEWS_BUCKET, previewKeys);

  await prisma.$transaction([
    prisma.photo.deleteMany({ where: { sortieId: sortie.id } }),
    prisma.slot.deleteMany({ where: { sortieId: sortie.id } }),
    prisma.sortie.update({ where: { id: sortie.id }, data: { purgeAt: null } }),
  ]);

  await track("group_purge", { operatorId: sortie.operatorId, meta: { sortieId: sortie.id } });
}

export async function runGroupPurgeScan(now: Date = new Date()): Promise<{ purged: number }> {
  const due = await prisma.sortie.findMany({
    where: { mode: "GROUPE", purgeAt: { lte: now } },
    select: { id: true },
  });

  for (const sortie of due) {
    await purgeGroupSortie(sortie.id);
  }

  return { purged: due.length };
}
