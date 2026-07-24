import { prisma } from "@/lib/prisma";

// Cible directe du header List-Unsubscribe (RFC 8058, "one-click") — doit
// répondre à un simple POST sans autre confirmation. Coupe les emails
// marketing (2 relance, 3 offre, 5 parrainage) ; jamais les transactionnels.
export async function POST(_request: Request, { params }: { params: { token: string } }): Promise<Response> {
  const participant = await prisma.participant.findUnique({ where: { token: params.token } });
  if (!participant) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!participant.unsubscribedAt) {
    await prisma.participant.update({ where: { id: participant.id }, data: { unsubscribedAt: new Date() } });
  }

  return Response.json({ ok: true }, { status: 200 });
}
