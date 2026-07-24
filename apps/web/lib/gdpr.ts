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
