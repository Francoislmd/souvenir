import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";

const schema = z.object({ slotId: z.string().min(1) });

/**
 * Le client d'une sortie de groupe choisit son départ, une seule fois. Le
 * créneau doit appartenir à SA sortie, et un choix déjà fait ne se change pas
 * ici : c'est ce qui borne ce qu'il voit (lib/access.ts, visiblePhotoWhere).
 */
export async function POST(request: Request, { params }: { params: { token: string } }): Promise<Response> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  const participant = await prisma.participant.findUnique({
    where: { token: params.token },
    select: { id: true, sortieId: true, slotId: true, deletedAt: true, sortie: { select: { operatorId: true } } },
  });
  if (!participant || participant.deletedAt) return Response.json({ error: "not_found" }, { status: 404 });
  if (participant.slotId) return Response.json({ ok: true, slotId: participant.slotId });

  const slot = await prisma.slot.findFirst({ where: { id: parsed.data.slotId, sortieId: participant.sortieId }, select: { id: true } });
  if (!slot) return Response.json({ error: "not_found" }, { status: 404 });

  // updateMany sur slotId: null : deux onglets ne peuvent pas poser deux choix.
  await prisma.participant.updateMany({ where: { id: participant.id, slotId: null }, data: { slotId: slot.id } });
  await track("slot_chosen", { operatorId: participant.sortie.operatorId, participantId: participant.id, meta: { slotId: slot.id } });
  return Response.json({ ok: true, slotId: slot.id });
}
