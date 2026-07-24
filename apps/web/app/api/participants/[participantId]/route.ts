import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { deriveChannel } from "@/lib/channel";

const schema = z.object({
  name: z.string().min(1, "Le prénom est requis"),
  contact: z.string().min(1, "Un email ou un numéro est requis"),
});

/** Ajout/suppression/modification possibles à tout moment (sortie en cours,
 * passée ou non commencée) — seule exception : une fois la galerie envoyée à
 * ce participant, sa fiche est figée (il a déjà reçu son lien). */
export async function PATCH(request: Request, { params }: { params: { participantId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const participant = await prisma.participant.findFirst({
      where: { id: params.participantId, sortie: { operatorId: dbUser.operatorId } },
    });
    if (!participant) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (participant.sentAt) {
      return Response.json({ error: "La galerie a déjà été envoyée à ce participant." }, { status: 409 });
    }

    const name = parsed.data.name.trim();
    const contact = parsed.data.contact.trim();
    await prisma.participant.update({
      where: { id: participant.id },
      data: { name, contact, channel: deriveChannel(contact) },
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/participants/[participantId]] PATCH", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { participantId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participant = await prisma.participant.findFirst({
      where: { id: params.participantId, sortie: { operatorId: dbUser.operatorId } },
    });
    if (!participant) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (participant.sentAt) {
      return Response.json({ error: "La galerie a déjà été envoyée à ce participant." }, { status: 409 });
    }

    await prisma.participant.delete({ where: { id: participant.id } });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/participants/[participantId]] DELETE", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
