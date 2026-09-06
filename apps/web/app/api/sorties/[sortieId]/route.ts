import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { track } from "@/lib/analytics";
import { deleteStorageObjects, ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "@/lib/storage";

const schema = z.object({
  activity: z.string().min(1).optional(),
  place: z.string().min(1).nullable().optional(),
  startsAt: z.string().min(1).optional(),
  seats: z.number().int().min(1).optional(),
  guide: z.string().min(1).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
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

    const updated = await prisma.sortie.update({
      where: { id: sortie.id },
      data: {
        ...(parsed.data.activity !== undefined ? { activity: parsed.data.activity } : {}),
        ...(parsed.data.place !== undefined ? { place: parsed.data.place } : {}),
        ...(parsed.data.startsAt !== undefined ? { startsAt: new Date(parsed.data.startsAt) } : {}),
        ...(parsed.data.seats !== undefined ? { seats: parsed.data.seats } : {}),
        ...(parsed.data.guide !== undefined ? { guide: parsed.data.guide } : {}),
      },
    });

    return Response.json({ sortieId: updated.id }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Suppression définitive — fiche, participants, photos et fichiers. Refusée
 *  si une commande existe déjà pour cette sortie : au-delà de la fiche, une
 *  commande porte la référence Stripe et l'historique de paiement, ça ne se
 *  perd pas comme une photo qu'on recadre. */
export async function DELETE(_request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
      include: { photos: true },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const hasOrder = await prisma.order.findFirst({ where: { participant: { sortieId: sortie.id } } });
    if (hasOrder) {
      return Response.json({ error: "Cette sortie a des commandes, elle ne peut pas être supprimée." }, { status: 409 });
    }

    // Cascade Prisma : participants, photos, slots et jobs de traitement
    // partent avec la sortie (schema.prisma, onDelete: Cascade).
    await prisma.sortie.delete({ where: { id: sortie.id } });

    const originalKeys = sortie.photos.map((p) => p.originalKey);
    const previewKeys = sortie.photos.flatMap((p) =>
      [p.previewKey, p.thumbKey, p.blurKey, p.blurEmailKey, p.groupPreviewKey].filter((key): key is string => Boolean(key)),
    );
    await deleteStorageObjects(ORIGINALS_BUCKET, originalKeys);
    await deleteStorageObjects(PREVIEWS_BUCKET, previewKeys);

    await track("sortie_deleted", { operatorId: dbUser.operatorId, meta: { sortieId: sortie.id, photoCount: sortie.photos.length } });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]] DELETE", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
