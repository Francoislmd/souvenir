import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { prisma, track } from "@souvenir/db";
import { supabaseAdmin, ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "../lib/supabase.js";

const LOCK_BADGE_SVG = `
<svg width="112" height="112" xmlns="http://www.w3.org/2000/svg">
  <circle cx="56" cy="56" r="56" fill="rgba(20,19,32,0.55)" />
  <g transform="translate(56,58)" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-17" y="-4" width="34" height="24" rx="5" />
    <path d="M -10 -4 V -14 A 10 10 0 0 1 10 -14 V -4" />
  </g>
</svg>`;

interface ProcessPreviewParams {
  photoId: string;
}

export async function processPreviewJob({ photoId }: ProcessPreviewParams): Promise<void> {
  const photo = await prisma.photo.findUniqueOrThrow({
    where: { id: photoId },
    include: { sortie: { include: { operator: true } } },
  });
  const operator = photo.sortie.operator;

  await prisma.photo.update({ where: { id: photoId }, data: { status: "PROCESSING" } });

  const dir = await mkdtemp(join(tmpdir(), "linktrip-"));
  try {
    const { data: original, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).download(photo.originalKey);
    if (error || !original) throw error ?? new Error("Failed to download original");

    const inputPath = join(dir, "input");
    await writeFile(inputPath, Buffer.from(await original.arrayBuffer()));

    // .rotate() sans argument : réoriente les pixels selon le tag EXIF de la
    // photo puis le supprime. Indispensable — sans ça l'image reste physiquement
    // dans le sens du capteur et ne compte que sur le tag EXIF pour s'afficher
    // droite ; certains clients (le proxy d'images de Gmail, notamment)
    // l'ignorent et la photo apparaît pivotée dans l'email.
    const thumbBuffer = await sharp(inputPath).rotate().resize({ width: 480 }).jpeg({ quality: 70 }).toBuffer();
    const previewBase = sharp(inputPath).rotate().resize({ width: 1280 });
    const previewBuffer = await watermarkBuffer(previewBase.jpeg({ quality: 78 }), operator, 1280);
    // Flou appliqué aux pixels, pas en CSS : les clients email (et les devtools
    // navigateur) ignorent filter:blur, ce JPEG doit déjà être flou. Léger :
    // on doit reconnaître la photo, pas juste deviner des couleurs. Source plus
    // large (960) qu'avant pour limiter l'agrandissement à l'affichage (le
    // carrousel l'étire sur ~1000px sur écran retina) — sinon le flou parait
    // bien plus fort à l'écran que le sigma appliqué ne le laisse penser.
    const blurBuffer = await sharp(inputPath).rotate().resize({ width: 960 }).blur(6).jpeg({ quality: 68 }).toBuffer();
    // Variante email : un cran plus flouté, et le cadenas est incrusté dans le
    // JPEG plutôt qu'en overlay CSS — Gmail (et la plupart des clients mail)
    // supprime `position: absolute` des styles inline, un overlay CSS n'y
    // survit pas. La galerie web, elle, garde son cadenas en CSS (BoutiqueGallery).
    const lockBadge = await sharp(Buffer.from(LOCK_BADGE_SVG)).resize(112, 112).png().toBuffer();
    const blurEmailBuffer = await sharp(inputPath)
      .rotate()
      .resize({ width: 960 })
      .blur(10)
      .composite([{ input: lockBadge, gravity: "center" }])
      .jpeg({ quality: 66 })
      .toBuffer();

    const thumbKey = `${photoId}/thumb.jpg`;
    const previewKey = `${photoId}/preview.jpg`;
    const blurKey = `${photoId}/blur.jpg`;
    const blurEmailKey = `${photoId}/blur-email.jpg`;

    await Promise.all([
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(thumbKey, thumbBuffer, { contentType: "image/jpeg", upsert: true }),
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(previewKey, previewBuffer, { contentType: "image/jpeg", upsert: true }),
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(blurKey, blurBuffer, { contentType: "image/jpeg", upsert: true }),
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(blurEmailKey, blurEmailBuffer, { contentType: "image/jpeg", upsert: true }),
    ]);

    await prisma.photo.update({ where: { id: photoId }, data: { thumbKey, previewKey, blurKey, blurEmailKey, status: "READY" } });

    await track("photo_ready", { operatorId: operator.id, meta: { photoId } });
  } finally {
    await rm(dir, { recursive: true, force: true });
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
    console.error("[worker] watermark skipped, invalid operator logo", operator.logoUrl, error);
    return image.toBuffer();
  }
}
