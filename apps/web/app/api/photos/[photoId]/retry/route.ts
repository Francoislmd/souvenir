import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

export async function POST(_request: Request, { params }: { params: { photoId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const photo = await prisma.photo.findFirst({
      where: { id: params.photoId, sortie: { operatorId: dbUser.operatorId } },
    });
    if (!photo) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.processingJob.updateMany({
      where: { photoId: photo.id, status: { in: ["pending", "running", "failed"] } },
      data: { status: "failed" },
    });
    await prisma.photo.update({ where: { id: photo.id }, data: { status: "UPLOADED" } });
    await prisma.processingJob.create({ data: { photoId: photo.id, kind: "preview" } });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/photos/[photoId]/retry]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
