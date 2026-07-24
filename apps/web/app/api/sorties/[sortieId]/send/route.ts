import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { sendParticipantGallery } from "@/lib/send-gallery";

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
