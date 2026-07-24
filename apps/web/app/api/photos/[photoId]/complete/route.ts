import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { runPhotoProcessing } from "@/lib/photo-processing";

// Une photo peut prendre quelques secondes à traiter (téléchargement +
// génération miniature/filigrane/flou) — marge au-delà du défaut Vercel.
export const maxDuration = 60;

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

    const job = await prisma.processingJob.create({ data: { photoId: photo.id, kind: "preview", status: "running" } });

    // Traité ici, dans ce même déploiement — pas de worker séparé à faire
    // tourner (voir CLAUDE.md §2 : zéro infra en plus). Le dépôt de photos
    // n'attend pas cet appel pour avancer (voir PhotoDropZone), donc ça ne
    // bloque pas le pro même si ça prend quelques secondes.
    await runPhotoProcessing(photo.id, job.id);

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/photos/[photoId]/complete]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
