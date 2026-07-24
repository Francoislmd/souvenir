import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

export async function DELETE(_request: Request, { params }: { params: { participantId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participant = await prisma.participant.findFirst({
      where: { id: params.participantId, sortie: { operatorId: dbUser.operatorId } },
      include: { sortie: true },
    });
    if (!participant) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (participant.sortie.status !== "UPCOMING") {
      return Response.json({ error: "Les photos ont déjà été triées pour cette sortie." }, { status: 409 });
    }

    await prisma.participant.delete({ where: { id: participant.id } });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/participants/[participantId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
