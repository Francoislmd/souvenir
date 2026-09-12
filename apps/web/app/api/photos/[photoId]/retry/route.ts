import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { runPhotoProcessing } from "@/lib/photo-processing";

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: { photoId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const photo = await prisma.photo.findFirst({
      where: { id: params.photoId, sortie: { operatorId: dbUser.operatorId } },
      select: { id: true },
    });
    if (!photo) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // runPhotoProcessing repasse la photo en PROCESSING puis READY ou FAILED :
    // pas besoin de la remettre en UPLOADED d'abord.
    await runPhotoProcessing(photo.id);

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/photos/[photoId]/retry]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
