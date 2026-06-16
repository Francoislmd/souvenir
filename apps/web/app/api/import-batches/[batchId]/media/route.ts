import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { getPreviewUrl } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: { batchId: string } }): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = await prisma.importBatch.findFirst({
    where: { id: params.batchId, session: { operatorId: dbUser.operatorId } },
    include: { media: { select: { id: true, kind: true, status: true, thumbKey: true } } },
  });

  if (!batch) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const media = batch.media.map((item) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    thumbUrl: item.thumbKey ? getPreviewUrl(item.thumbKey) : null,
  }));

  return Response.json({ media }, { status: 200 });
}
