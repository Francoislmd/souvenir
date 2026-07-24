import { prisma } from "@/lib/prisma";
import { purgeParticipant } from "@/lib/gdpr";

export async function POST(_request: Request, { params }: { params: { token: string } }): Promise<Response> {
  const participant = await prisma.participant.findUnique({ where: { token: params.token } });
  if (!participant) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await purgeParticipant(participant.id);

  return Response.json({ ok: true }, { status: 200 });
}
