import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

export async function POST(_request: Request, { params }: { params: { mediaId: string } }): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const media = await prisma.media.findFirst({
    where: {
      id: params.mediaId,
      OR: [
        { delivery: { session: { operatorId: dbUser.operatorId } } },
        { importBatch: { session: { operatorId: dbUser.operatorId } } },
      ],
    },
  });

  if (!media) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (media.status !== "FAILED" && media.status !== "PROCESSING") {
    return Response.json({ error: "Media is not in a retryable state" }, { status: 400 });
  }

  await prisma.media.update({ where: { id: media.id }, data: { status: "UPLOADED" } });
  // Reset les jobs existants et en recrée un propre
  await prisma.processingJob.updateMany({ where: { mediaId: media.id }, data: { status: "failed" } });
  await prisma.processingJob.create({ data: { mediaId: media.id, kind: "preview" } });

  return Response.json({ ok: true }, { status: 200 });
}
