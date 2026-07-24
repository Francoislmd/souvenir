import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

const schema = z.object({ ownerId: z.string().min(1).nullable() });

/** Réassignation manuelle d'une photo à un autre participant (ou aux photos
 * communes, ownerId: null) — correctif ponctuel avant l'envoi, quand la
 * répartition automatique s'est trompée. */
export async function PATCH(request: Request, { params }: { params: { photoId: string } }): Promise<Response> {
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

    const photo = await prisma.photo.findFirst({
      where: { id: params.photoId, sortie: { operatorId: dbUser.operatorId } },
    });
    if (!photo) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (parsed.data.ownerId) {
      const participant = await prisma.participant.findFirst({
        where: { id: parsed.data.ownerId, sortieId: photo.sortieId },
      });
      if (!participant) {
        return Response.json({ error: "Participant introuvable pour cette sortie." }, { status: 400 });
      }
    }

    await prisma.photo.update({ where: { id: photo.id }, data: { ownerId: parsed.data.ownerId } });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/photos/[photoId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
