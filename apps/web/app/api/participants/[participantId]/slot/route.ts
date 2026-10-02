import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { sendPrivateInvite } from "@/lib/private-link";

const schema = z.object({ slotId: z.string().min(1) });

/**
 * Le prestataire indique le départ d'un client de sortie de groupe. C'est
 * le dossard de Finisher Memories : son lien n'ouvrira que ce départ. Si la
 * galerie est en ligne et que le lien n'est pas encore parti, il part ici.
 *
 * Un client qui a déjà payé garde son départ : en changer ferait disparaître
 * de sa galerie les photos qu'il a achetées.
 */
export async function POST(request: Request, { params }: { params: { participantId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

    const participant = await prisma.participant.findFirst({
      where: { id: params.participantId, deletedAt: null, sortie: { operatorId: dbUser.operatorId, mode: "GROUPE" } },
      include: { sortie: { include: { operator: true } }, orders: { where: { status: "succeeded" }, select: { id: true } } },
    });
    if (!participant) return Response.json({ error: "Not found" }, { status: 404 });

    const slot = await prisma.slot.findFirst({ where: { id: parsed.data.slotId, sortieId: participant.sortieId }, select: { id: true } });
    if (!slot) return Response.json({ error: "Not found" }, { status: 404 });

    if (participant.slotId === slot.id) return Response.json({ ok: true, sent: false });
    if (participant.slotId && participant.orders.length > 0) {
      return Response.json({ error: "Ce client a déjà acheté des photos de son départ." }, { status: 409 });
    }

    await prisma.participant.update({ where: { id: participant.id }, data: { slotId: slot.id } });
    await track("slot_assigned", { operatorId: dbUser.operatorId, participantId: participant.id, meta: { slotId: slot.id } });

    let sent = false;
    if (participant.sortie.status === "SENT" && !participant.sentAt && participant.channel === "EMAIL") {
      try {
        await sendPrivateInvite(participant, participant.sortie);
        sent = true;
      } catch (error) {
        console.error("[API /api/participants/[participantId]/slot] send failed", error);
        return Response.json({ ok: true, sent: false, error: "Départ enregistré, mais l'envoi du lien a échoué." });
      }
    }
    return Response.json({ ok: true, sent });
  } catch (error) {
    console.error("[API /api/participants/[participantId]/slot]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
