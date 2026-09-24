import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { ORIGINALS_BUCKET, createSignedUploadUrl } from "@/lib/storage";

/**
 * Des URL d'envoi neuves pour une photo déjà enregistrée.
 *
 * Celles rendues à l'enregistrement expirent au bout de 6 h. Un dépôt
 * interrompu (onglet fermé, téléphone éteint) qui reprend le lendemain
 * poussait ses octets vers une URL morte, échouait quatre fois, et occupait
 * la file pendant ce temps : vu le 24/09/2026, 38 photos de juillet passaient
 * devant chaque nouveau dépôt. UploadQueueProvider en redemande ici avant
 * tout envoi dont les URL ont plus de 5 h, et après tout refus du stockage.
 *
 * GET ?original=…&poster=… : les tailles exactes, signées dans l'URL. Leur
 * somme ne peut pas dépasser ce que le quota a compté au dépôt.
 */
export async function GET(request: Request, { params }: { params: { photoId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const photo = await prisma.photo.findFirst({
      where: { id: params.photoId, sortie: { operatorId: dbUser.operatorId } },
      select: { id: true, originalKey: true, posterKey: true, sizeBytes: true },
    });
    if (!photo) return Response.json({ error: "Not found" }, { status: 404 });

    const url = new URL(request.url);
    const original = Number(url.searchParams.get("original"));
    const poster = url.searchParams.has("poster") ? Number(url.searchParams.get("poster")) : 0;
    const valid = (n: number): boolean => Number.isInteger(n) && n > 0;
    if (!valid(original) || (poster !== 0 && !valid(poster)) || original + poster > (photo.sizeBytes ?? Infinity)) {
      return Response.json({ error: "bad_size" }, { status: 400 });
    }

    const [signedUrl, posterSignedUrl] = await Promise.all([
      createSignedUploadUrl(ORIGINALS_BUCKET, photo.originalKey, original),
      photo.posterKey && poster > 0 ? createSignedUploadUrl(ORIGINALS_BUCKET, photo.posterKey, poster) : Promise.resolve(null),
    ]);
    return Response.json({ signedUrl, posterSignedUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[API /api/photos/[photoId]/upload]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
