import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { sendParticipantGallery } from "@/lib/send-gallery";
import { computeFreeSamples } from "@/lib/assign";

export async function POST(_request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
      include: { participants: { where: { sentAt: null }, orderBy: { createdAt: "asc" } } },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // La répartition étant manuelle (pas d'assignation automatique au dépôt),
    // les échantillons offerts se calculent ici, sur la répartition finale
    // que le pro a laissée juste avant l'envoi.
    const photos = await prisma.photo.findMany({
      where: { sortieId: sortie.id, status: { not: "FAILED" } },
      orderBy: { createdAt: "asc" },
      select: { id: true, ownerId: true },
    });
    const ownerAssignment = new Map(photos.map((p) => [p.id, p.ownerId]));
    const freeSamples = computeFreeSamples(ownerAssignment, photos.map((p) => p.id), dbUser.operator.freeCount);
    await prisma.$transaction(
      photos.map((p) => prisma.photo.update({ where: { id: p.id }, data: { isFreeSample: freeSamples.has(p.id) } })),
    );

    const results: { participantId: string; sent: boolean }[] = [];
    for (const participant of sortie.participants) {
      const result = await sendParticipantGallery(participant, sortie, dbUser.operator);
      results.push({ participantId: participant.id, sent: result.sent });
    }

    await prisma.sortie.update({ where: { id: sortie.id }, data: { status: "SENT" } });

    return Response.json({ results }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/send]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
