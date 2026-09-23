import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { ORIGINALS_BUCKET, createSignedUploadUrl, objectSize } from "@/lib/storage";
import { MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from "@/lib/media";

/**
 * La seconde phase du dépôt : l'original (photo pleine définition, vidéo)
 * part après la copie de travail, quand la sortie est déjà publiable.
 *
 * GET ?size=… : une URL d'envoi neuve, demandée juste avant l'envoi. Cette
 * phase peut reprendre le lendemain (le navigateur s'arrête avec l'onglet),
 * bien après l'expiration de l'URL rendue au dépôt.
 * POST : l'original est arrivé ; vérifié dans le stockage avant d'être cru.
 */

async function ownedPhoto(photoId: string) {
  const dbUser = await getOperatorUser();
  if (!dbUser) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, sortie: { operatorId: dbUser.operatorId } },
    select: { id: true, originalKey: true, isVideo: true, sizeBytes: true, originalPending: true },
  });
  if (!photo) return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  return { photo };
}

export async function GET(request: Request, { params }: { params: { photoId: string } }): Promise<Response> {
  try {
    const { photo, error } = await ownedPhoto(params.photoId);
    if (error) return error;
    if (!photo.originalPending) return Response.json({ done: true });
    const size = Number(new URL(request.url).searchParams.get("size"));
    // La taille a été comptée au dépôt (lib/storage-quota.ts) : l'original ne
    // peut pas peser plus que ce qui a été réservé.
    const max = Math.min(photo.sizeBytes ?? Infinity, photo.isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES);
    if (!Number.isInteger(size) || size <= 0 || size > max) {
      return Response.json({ error: "bad_size" }, { status: 400 });
    }
    const signedUrl = await createSignedUploadUrl(ORIGINALS_BUCKET, photo.originalKey, size);
    return Response.json({ signedUrl });
  } catch (error) {
    console.error("[API /api/photos/[photoId]/original GET]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: { params: { photoId: string } }): Promise<Response> {
  try {
    const { photo, error } = await ownedPhoto(params.photoId);
    if (error) return error;
    if (!photo.originalPending) return Response.json({ ok: true });
    const size = await objectSize(ORIGINALS_BUCKET, photo.originalKey);
    if (!size) return Response.json({ error: "missing" }, { status: 409 });
    await prisma.photo.update({ where: { id: photo.id }, data: { originalPending: false } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[API /api/photos/[photoId]/original POST]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
