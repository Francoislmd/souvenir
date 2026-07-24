import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { supabaseAdmin } from "./supabase";
import { ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "./storage";

/**
 * Génère miniature, aperçu filigrané et aperçu flouté pour une photo, puis
 * passe son statut à READY (ou FAILED en cas d'échec).
 *
 * Tourne dans le même déploiement Vercel que le reste de l'app (déclenché
 * via `after()` juste après l'upload, voir /api/photos/[photoId]/complete)
 * — pas de worker séparé, zéro infra en plus (voir CLAUDE.md §2).
 */
export async function processPhotoPreview(photoId: string): Promise<void> {
  const photo = await prisma.photo.findUniqueOrThrow({
    where: { id: photoId },
    include: { sortie: { include: { operator: true } } },
  });
  const operator = photo.sortie.operator;

  await prisma.photo.update({ where: { id: photoId }, data: { status: "PROCESSING" } });

  const dir = await mkdtemp(join(tmpdir(), "souvenir-"));
  try {
    const { data: original, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).download(photo.originalKey);
    if (error || !original) throw error ?? new Error("Failed to download original");

    const inputPath = join(dir, "input");
    await writeFile(inputPath, Buffer.from(await original.arrayBuffer()));

    const thumbBuffer = await sharp(inputPath).resize({ width: 480 }).jpeg({ quality: 70 }).toBuffer();
    const previewBase = sharp(inputPath).resize({ width: 1280 });
    const previewBuffer = await watermarkBuffer(previewBase.jpeg({ quality: 78 }), operator, 1280);
    // Flou appliqué aux pixels, pas en CSS : les clients email (et les devtools
    // navigateur) ignorent filter:blur, ce JPEG doit déjà être flou. Léger :
    // on doit reconnaître la photo, pas juste deviner des couleurs. Source plus
    // large (960) qu'avant pour limiter l'agrandissement à l'affichage (le
    // carrousel l'étire sur ~1000px sur écran retina) — sinon le flou parait
    // bien plus fort à l'écran que le sigma appliqué ne le laisse penser.
    const blurBuffer = await sharp(inputPath).resize({ width: 960 }).blur(6).jpeg({ quality: 68 }).toBuffer();

    const thumbKey = `${photoId}/thumb.jpg`;
    const previewKey = `${photoId}/preview.jpg`;
    const blurKey = `${photoId}/blur.jpg`;

    await Promise.all([
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(thumbKey, thumbBuffer, { contentType: "image/jpeg", upsert: true }),
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(previewKey, previewBuffer, { contentType: "image/jpeg", upsert: true }),
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(blurKey, blurBuffer, { contentType: "image/jpeg", upsert: true }),
    ]);

    await prisma.photo.update({ where: { id: photoId }, data: { thumbKey, previewKey, blurKey, status: "READY" } });

    await track("photo_ready", { operatorId: operator.id, meta: { photoId } });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Enrobe processPhotoPreview : marque la photo (et la tâche associée si
 * fournie) FAILED en cas d'erreur, plutôt que de laisser planter l'appelant. */
export async function runPhotoProcessing(photoId: string, jobId?: string): Promise<void> {
  try {
    await processPhotoPreview(photoId);
    if (jobId) await prisma.processingJob.update({ where: { id: jobId }, data: { status: "done" } });
  } catch (error) {
    console.error(`[photo-processing] ${photoId} failed`, error);
    await prisma.photo.update({ where: { id: photoId }, data: { status: "FAILED" } });
    if (jobId) await prisma.processingJob.update({ where: { id: jobId }, data: { status: "failed" } });
  }
}

interface OperatorBrand {
  logoUrl: string | null;
}

async function watermarkBuffer(image: sharp.Sharp, operator: OperatorBrand, width: number): Promise<Buffer> {
  if (!operator.logoUrl) return image.toBuffer();

  try {
    const logoRes = await fetch(operator.logoUrl);
    const contentType = logoRes.headers.get("content-type") ?? "";
    if (!logoRes.ok || !contentType.startsWith("image/")) {
      throw new Error(`logo URL did not return an image (status ${logoRes.status}, content-type "${contentType}")`);
    }

    const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
    const logoWidth = Math.round(width * 0.18);
    const logo = await sharp(logoBuffer)
      .resize({ width: logoWidth })
      .composite([{ input: Buffer.from([255, 255, 255, Math.round(255 * 0.6)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: "dest-in" }])
      .toBuffer();

    return image.composite([{ input: logo, gravity: "southeast" }]).toBuffer();
  } catch (error) {
    console.error("[photo-processing] watermark skipped, invalid operator logo", operator.logoUrl, error);
    return image.toBuffer();
  }
}
