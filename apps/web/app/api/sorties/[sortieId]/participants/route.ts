import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { deriveChannel } from "@/lib/channel";

const DAY_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  name: z.string().min(1, "Le prénom est requis"),
  contact: z.string().min(1, "Un email ou un numéro est requis"),
});

export async function POST(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
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

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const participant = await prisma.participant.create({
      data: {
        sortieId: sortie.id,
        name: parsed.data.name.trim(),
        contact: parsed.data.contact.trim(),
        channel: deriveChannel(parsed.data.contact.trim()),
        token: crypto.randomUUID(),
        consentAt: now,
        deleteAt: new Date(now.getTime() + 90 * DAY_MS),
      },
    });

    await track("participant_created", { operatorId: dbUser.operatorId, participantId: participant.id });

    return Response.json({ participantId: participant.id }, { status: 201 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/participants]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
