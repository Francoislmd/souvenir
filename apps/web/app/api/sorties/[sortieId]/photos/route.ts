import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { getPreviewUrl } from "@/lib/storage";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { MAX_VIDEO_BYTES, MAX_VIDEO_MB, extensionOf, isVideoFilename } from "@/lib/media";

const schema = z.object({
  filename: z.string().min(1),
  // Vidéo : ce que le navigateur a lu du fichier au dépôt (lib/video-probe.ts).
  // Tout est facultatif — une vidéo sans vignette ni heure reste déposable.
  kind: z.enum(["photo", "video"]).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  durationSec: z.number().nonnegative().max(24 * 3600).nullable().optional(),
  takenAt: z.string().datetime().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sortie = await prisma.sortie.findFirst({ where: { id: params.sortieId, operatorId: dbUser.operatorId } });
  if (!sortie) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await prisma.photo.findMany({
    where: { sortieId: sortie.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, ownerId: true, thumbKey: true, isVideo: true, durationSec: true },
  });

  return Response.json({
    photos: photos.map((p) => ({
      id: p.id,
      status: p.status,
      ownerId: p.ownerId,
      thumbUrl: p.thumbKey ? getPreviewUrl(p.thumbKey) : null,
      isVideo: p.isVideo,
      durationSec: p.durationSec,
    })),
  });
}

export async function POST(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const ext = extensionOf(parsed.data.filename);
    const isVideo = parsed.data.kind === "video" || isVideoFilename(parsed.data.filename);
    // Le navigateur filtre déjà (UploadQueueProvider) ; ceci protège d'un
    // envoi qui échouerait côté stockage après avoir poussé tous ses octets.
    if (isVideo && parsed.data.sizeBytes !== undefined && parsed.data.sizeBytes > MAX_VIDEO_BYTES) {
      return Response.json({ error: "video_too_large", maxMb: MAX_VIDEO_MB }, { status: 413 });
    }

    const base = `${sortie.id}/${crypto.randomUUID()}`;
    const originalKey = `${base}${ext ? `.${ext}` : ""}`;
    // La vignette d'une vidéo vit à côté d'elle, dans le bucket privé : c'est
    // une image nette, sans filigrane. Seules ses dérivées vont dans `previews`.
    const posterKey = isVideo ? `${base}-poster.jpg` : null;

    const bucket = supabaseAdmin.storage.from("originals");
    const [upload, posterUpload] = await Promise.all([
      bucket.createSignedUploadUrl(originalKey),
      posterKey ? bucket.createSignedUploadUrl(posterKey) : Promise.resolve(null),
    ]);
    if (upload.error || !upload.data) {
      throw upload.error ?? new Error("Failed to create signed upload URL");
    }
    if (posterUpload && (posterUpload.error || !posterUpload.data)) {
      throw posterUpload.error ?? new Error("Failed to create poster signed upload URL");
    }

    const takenAt = parsed.data.takenAt ? new Date(parsed.data.takenAt) : null;
    const photo = await prisma.photo.create({
      data: {
        sortieId: sortie.id,
        originalKey,
        status: "UPLOADED",
        ...(isVideo
          ? {
              isVideo: true,
              posterKey,
              durationSec: parsed.data.durationSec != null ? Math.round(parsed.data.durationSec) : null,
              takenAt,
            }
          : {}),
      },
    });

    // Aucune répartition automatique — les photos arrivent communes (ownerId
    // null), le pro les attribue lui-même depuis l'écran de tri. On marque
    // juste la sortie comme "triée" dès la première photo, pour l'afficher
    // correctement dans la liste des sorties.
    if (sortie.status === "UPCOMING") {
      await prisma.sortie.update({ where: { id: sortie.id }, data: { status: "SORTED" } });
    }

    await track("photos_uploaded", { operatorId: dbUser.operatorId, meta: { photoId: photo.id, ...(isVideo ? { video: true } : {}) } });

    return Response.json(
      { photoId: photo.id, signedUrl: upload.data.signedUrl, posterSignedUrl: posterUpload?.data?.signedUrl ?? null },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/photos]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
