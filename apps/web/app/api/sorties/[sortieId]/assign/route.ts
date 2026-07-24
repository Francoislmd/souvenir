import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { computeOwnerAssignment, computeFreeSamples } from "@/lib/assign";

export async function POST(_request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
      include: {
        participants: { orderBy: { createdAt: "asc" } },
        photos: { where: { status: "READY" }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (sortie.photos.length === 0) {
      return Response.json({ error: "Aucune photo prête à trier." }, { status: 409 });
    }

    const assignment = computeOwnerAssignment(sortie.photos, sortie.participants);
    const photoOrder = sortie.photos.map((p) => p.id);
    const freeSamples = computeFreeSamples(assignment, photoOrder, dbUser.operator.freeCount);

    await prisma.$transaction(
      sortie.photos.map((photo) =>
        prisma.photo.update({
          where: { id: photo.id },
          data: { ownerId: assignment.get(photo.id) ?? null, isFreeSample: freeSamples.has(photo.id) },
        }),
      ),
    );

    await prisma.sortie.update({ where: { id: sortie.id }, data: { status: "SORTED" } });
    await track("photos_assigned", { operatorId: dbUser.operatorId, meta: { sortieId: sortie.id, count: sortie.photos.length } });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/assign]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
