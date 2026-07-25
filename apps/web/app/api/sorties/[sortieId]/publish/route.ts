import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { publishGroupSortie } from "@/lib/group-publish";

// Regroupe les photos par créneau (lecture EXIF de chaque original) puis
// publie le lien — peut prendre plusieurs secondes sur un gros lot.
export const maxDuration = 120;

export async function POST(_request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
      include: { _count: { select: { photos: true } } },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (sortie.mode !== "GROUPE") {
      return Response.json({ error: "Not a group sortie" }, { status: 409 });
    }
    if (sortie._count.photos === 0) {
      return Response.json({ error: "No photos" }, { status: 409 });
    }

    await publishGroupSortie(sortie.id);

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/publish]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
