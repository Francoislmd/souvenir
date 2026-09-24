import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORIGINALS_BUCKET, createSignedUploadUrl, getPreviewUrl } from "@/lib/storage";
import { withStorageBudget } from "@/lib/storage-quota";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { MAX_PHOTO_BYTES, MAX_VIDEO_BYTES, MAX_VIDEO_MB, extensionOf, isVideoFilename } from "@/lib/media";

const itemSchema = z.object({
  filename: z.string().min(1),
  // Vidéo : ce que le navigateur a lu du fichier au dépôt (lib/video-probe.ts).
  // Tout est facultatif — une vidéo sans vignette ni heure reste déposable.
  kind: z.enum(["photo", "video"]).optional(),
  // Obligatoire : signée dans l'URL d'envoi et comptée par le quota de
  // stockage (lib/storage-quota.ts). Un onglet ouvert avant cette règle
  // échoue à l'enregistrement et reprend après rechargement.
  sizeBytes: z.number().int().positive(),
  // L'image envoyée d'abord, d'où partent les aperçus : la vignette d'une
  // vidéo, ou la copie de travail 2048 px d'une photo (lib/fast-copy.ts).
  // Avec elle, l'original arrive ensuite, en tâche de fond.
  posterBytes: z.number().int().positive().max(20_000_000).nullable().optional(),
  durationSec: z.number().nonnegative().max(24 * 3600).nullable().optional(),
  takenAt: z.string().datetime().nullable().optional(),
});

/**
 * Un lot : toutes les photos prêtes au même moment, enregistrées en une
 * requête (UploadQueueProvider). Avant le 24/09/2026, chaque photo avait sa
 * requête, et toutes passaient l'une après l'autre sous le verrou du quota :
 * mesuré en production, 5 à 10 s par fiche sur un dépôt de 20 photos, avant
 * même le premier octet envoyé.
 */
const batchSchema = z.object({ items: z.array(itemSchema).min(1).max(50) });

type Item = z.infer<typeof itemSchema>;
type Registered =
  | { ok: true; photoId: string; signedUrl: string; posterSignedUrl: string | null; originalPending: boolean }
  | { ok: false; status: 413 | 507; error: string };

export async function GET(_request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sortie = await prisma.sortie.findFirst({ where: { id: params.sortieId, operatorId: dbUser.operatorId }, select: { id: true } });
  if (!sortie) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await prisma.photo.findMany({
    where: { sortieId: sortie.id },
    // id en second : un lot enregistré dans une même transaction partage la
    // même milliseconde, et l'ordre ne doit pas changer d'une lecture à l'autre.
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, status: true, ownerId: true, thumbKey: true, isVideo: true, durationSec: true, originalPending: true },
  });

  return Response.json(
    {
      photos: photos.map((p) => ({
        id: p.id,
        status: p.status,
        ownerId: p.ownerId,
        thumbUrl: p.thumbKey ? getPreviewUrl(p.thumbKey) : null,
        isVideo: p.isVideo,
        durationSec: p.durationSec,
        originalPending: p.originalPending,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function planOf(sortieId: string, item: Item) {
  const ext = extensionOf(item.filename);
  const isVideo = item.kind === "video" || isVideoFilename(item.filename);
  const base = `${sortieId}/${crypto.randomUUID()}`;
  const originalKey = `${base}${ext ? `.${ext}` : ""}`;
  // La vignette d'une vidéo, ou la copie de travail d'une photo, vit à côté
  // de l'original dans le bucket privé : c'est une image nette, sans
  // filigrane. Seules ses dérivées vont dans `previews`.
  const posterBytes = item.posterBytes ?? null;
  const posterKey = isVideo ? `${base}-poster.jpg` : posterBytes ? `${base}-work.jpg` : null;
  // L'original suit la copie : la photo est publiable avant qu'il n'arrive.
  // Une vidéo passe toujours par là, même sans vignette (image de repli).
  const originalPending = isVideo || posterKey !== null;
  return { isVideo, originalKey, posterKey, posterBytes, originalPending, totalBytes: item.sizeBytes + (posterBytes ?? 0) };
}

export async function POST(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const batch = batchSchema.safeParse(body);
    // Un onglet resté ouvert sur l'ancienne version envoie encore une photo seule.
    const single = batch.success ? null : itemSchema.safeParse(body);
    if (!batch.success && !single?.success) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }
    const items: Item[] = batch.success ? batch.data.items : [single!.data!];

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
      select: { id: true, status: true },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const plans = items.map((item) => planOf(sortie.id, item));
    const results: (Registered | null)[] = items.map((item, i) => {
      // Le navigateur filtre déjà ; ceci protège d'un envoi qui échouerait
      // côté stockage après avoir poussé tous ses octets.
      const max = plans[i]!.isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
      return item.sizeBytes > max ? { ok: false, status: 413, error: plans[i]!.isVideo ? "video_too_large" : "photo_too_large" } : null;
    });

    // Un seul passage sous le verrou du quota pour tout le lot. Ce qui ne
    // tient plus dans la place restante est refusé, le reste passe : on ne
    // perd pas tout un dépôt pour sa dernière vidéo.
    // Un objet : TypeScript ne suit pas une affectation faite dans le rappel.
    const full: { usedBytes: number | null } = { usedBytes: null };
    const created = new Map<number, string>();
    await withStorageBudget(async (tx, budget) => {
      let free = budget.free;
      for (let i = 0; i < items.length; i++) {
        if (results[i]) continue;
        const plan = plans[i]!;
        const item = items[i]!;
        const cost = plan.totalBytes + budget.perPhoto;
        if (cost > free) {
          results[i] = { ok: false, status: 507, error: "storage_full" };
          full.usedBytes ??= budget.used;
          continue;
        }
        free -= cost;
        const photo = await tx.photo.create({
          data: {
            sortieId: sortie.id,
            originalKey: plan.originalKey,
            status: "UPLOADED",
            sizeBytes: plan.totalBytes,
            posterKey: plan.posterKey,
            originalPending: plan.originalPending,
            // Lue par le navigateur : la copie de travail n'a plus d'EXIF.
            takenAt: item.takenAt ? new Date(item.takenAt) : null,
            ...(plan.isVideo
              ? { isVideo: true, durationSec: item.durationSec != null ? Math.round(item.durationSec) : null }
              : {}),
          },
          select: { id: true },
        });
        created.set(i, photo.id);
      }
    });

    // Signer une URL ne fait aucun appel réseau : c'est un calcul local.
    await Promise.all(
      Array.from(created.entries()).map(async ([i, photoId]) => {
        const plan = plans[i]!;
        const [signedUrl, posterSignedUrl] = await Promise.all([
          createSignedUploadUrl(ORIGINALS_BUCKET, plan.originalKey, items[i]!.sizeBytes),
          plan.posterKey && plan.posterBytes ? createSignedUploadUrl(ORIGINALS_BUCKET, plan.posterKey, plan.posterBytes) : Promise.resolve(null),
        ]);
        results[i] = { ok: true, photoId, signedUrl, posterSignedUrl, originalPending: plan.originalPending };
      }),
    );

    // Aucune répartition automatique — les photos arrivent communes (ownerId
    // null), le pro les attribue lui-même depuis l'écran de tri. On marque
    // juste la sortie comme "triée" dès la première photo, pour l'afficher
    // correctement dans la liste des sorties.
    if (created.size > 0 && sortie.status === "UPCOMING") {
      await prisma.sortie.update({ where: { id: sortie.id }, data: { status: "SORTED" } });
    }
    await Promise.all([
      created.size > 0
        ? track("photos_uploaded", { operatorId: dbUser.operatorId, meta: { count: created.size, sortieId: sortie.id } })
        : Promise.resolve(),
      full.usedBytes !== null
        ? track("storage_full", { operatorId: dbUser.operatorId, meta: { usedBytes: full.usedBytes, refused: results.filter((r) => r && !r.ok && r.status === 507).length } })
        : Promise.resolve(),
    ]);

    const final = results.map((r) => r ?? { ok: false as const, status: 507 as const, error: "storage_full" });
    if (!batch.success) {
      // Réponse d'avant, pour l'onglet resté sur l'ancienne version.
      const only = final[0]!;
      if (!only.ok) return Response.json({ error: only.error, maxMb: MAX_VIDEO_MB }, { status: only.status });
      return Response.json(
        { photoId: only.photoId, signedUrl: only.signedUrl, posterSignedUrl: only.posterSignedUrl, originalPending: only.originalPending },
        { status: 201 },
      );
    }
    return Response.json({ results: final, maxMb: MAX_VIDEO_MB }, { status: 201 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/photos]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
