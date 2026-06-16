import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

export async function POST(_request: Request, { params }: { params: { batchId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batch = await prisma.importBatch.findFirst({
      where: { id: params.batchId, session: { operatorId: dbUser.operatorId } },
      include: { media: { select: { id: true, status: true } } },
    });

    if (!batch) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const ready = batch.media.filter((media) => media.status === "READY");

    await prisma.importBatch.update({ where: { id: batch.id }, data: { status: "sorted" } });

    return Response.json(
      { groups: [{ label: "Toutes les photos", mediaIds: ready.map((media) => media.id) }] },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API /api/import-batches/[batchId]/sort]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
