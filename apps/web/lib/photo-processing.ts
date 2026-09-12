import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { supabaseAdmin } from "./supabase";
import { ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "./storage";
import { generateGroupPreview } from "./group-watermark";

const LOCK_BADGE_SVG = `
<svg width="112" height="112" xmlns="http://www.w3.org/2000/svg">
  <circle cx="56" cy="56" r="56" fill="rgba(20,19,32,0.55)" />
  <g transform="translate(56,58)" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-17" y="-4" width="34" height="24" rx="5" />
    <path d="M -10 -4 V -14 A 10 10 0 0 1 10 -14 V -4" />
  </g>
</svg>`;

/**
 * Génère miniature, aperçu filigrané (corner-logo, offert/acheté), aperçu
 * flouté pour l'email et — mode INDIVIDUEL — aperçu filigrané tuilé verrouillé
 * (même mécanisme qu'en mode GROUPE) pour une photo, puis passe son statut à
 * READY (ou FAILED en cas d'échec).
 *
 * Tourne dans le même déploiement Vercel que le reste de l'app (déclenché
 * par /api/photos/[photoId]/complete juste après l'upload) — pas de worker
 * séparé, zéro infra en plus (voir CLAUDE.md §2).
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

    const originalBuffer = Buffer.from(await original.arrayBuffer());
    const inputPath = join(dir, "input");
    await writeFile(inputPath, originalBuffer);

    // Une seule décompression de l'original (24 Mpx sur un reflex récent) au
    // lieu de trois : miniature, aperçu filigrané et flou email dérivent tous
    // de la même base 1280 px gardée en pixels bruts. Décoder trois fois le
    // JPEG d'origine était le gros du temps de traitement d'une photo.
    //
    // .rotate() sans argument : réoriente les pixels selon le tag EXIF de la
    // photo puis le supprime. Indispensable — sans ça l'image reste physiquement
    // dans le sens du capteur et ne compte que sur le tag EXIF pour s'afficher
    // droite ; certains clients (le proxy d'images de Gmail, notamment)
    // l'ignorent et la photo apparaît pivotée dans l'email.
    const { data: baseData, info: baseInfo } = await sharp(inputPath)
      .rotate()
      .resize({ width: 1280 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const base = (): sharp.Sharp =>
      sharp(baseData, {
        raw: { width: baseInfo.width, height: baseInfo.height, channels: baseInfo.channels as 1 | 2 | 3 | 4 },
      });

    const thumbKey = `${photoId}/thumb.jpg`;
    const previewKey = `${photoId}/preview.jpg`;
    const blurEmailKey = `${photoId}/blur-email.jpg`;

    // La miniature part la première et la fiche est mise à jour dans la
    // foulée : la grille de l'opérateur se remplit pendant que le filigrane et
    // le flou se calculent, plutôt qu'à la toute fin du traitement.
    const thumbBuffer = await base().resize({ width: 480 }).jpeg({ quality: 70 }).toBuffer();
    await supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(thumbKey, thumbBuffer, { contentType: "image/jpeg", upsert: true });
    await prisma.photo.update({ where: { id: photoId }, data: { thumbKey } });

    const previewBuffer = await watermarkBuffer(base().jpeg({ quality: 78 }), operator, 1280);
    // Variante email : flou (pixels, pas CSS — les clients mail l'ignorent) et
    // cadenas incrusté dans le JPEG plutôt qu'en overlay CSS, que Gmail (et la
    // plupart des clients mail) supprime des styles inline. La galerie web,
    // elle, n'a plus de flou global : aperçu verrouillé = même filigrane
    // diagonal qu'en mode GROUPE (Photo.groupPreviewKey,
    // lib/group-watermark.ts), qui porte déjà son propre cadenas incrusté —
    // jamais de photo qui se dévoile en un clic devtools.
    const lockBadge = await sharp(Buffer.from(LOCK_BADGE_SVG)).resize(112, 112).png().toBuffer();
    const blurEmailBuffer = await base()
      .resize({ width: 960 })
      .blur(10)
      .composite([{ input: lockBadge, gravity: "center" }])
      .jpeg({ quality: 66 })
      .toBuffer();

    // Mode GROUPE : l'aperçu filigrané est (re)généré à la publication de la
    // sortie (lib/group-publish.ts) — pas ici, ce serait un calcul perdu (visages
    // détectés puis jamais servi tant que la sortie n'est pas publiée).
    const groupPreviewBuffer = photo.sortie.mode === "INDIVIDUEL" ? await generateGroupPreview(originalBuffer, operator.name) : null;
    const groupPreviewKey = groupPreviewBuffer ? `${photoId}/group-preview.jpg` : null;

    await Promise.all([
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(previewKey, previewBuffer, { contentType: "image/jpeg", upsert: true }),
      supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(blurEmailKey, blurEmailBuffer, { contentType: "image/jpeg", upsert: true }),
      groupPreviewKey && groupPreviewBuffer
        ? supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(groupPreviewKey, groupPreviewBuffer, { contentType: "image/jpeg", upsert: true })
        : Promise.resolve(),
    ]);

    // groupPreviewKey omis (plutôt que mis à null) en mode GROUPE : un retry
    // après publication ne doit pas effacer l'aperçu déjà généré par
    // lib/group-publish.ts.
    await prisma.photo.update({
      where: { id: photoId },
      data: { thumbKey, previewKey, blurEmailKey, status: "READY", ...(groupPreviewKey ? { groupPreviewKey } : {}) },
    });

    await track("photo_ready", { operatorId: operator.id, meta: { photoId } });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Enrobe processPhotoPreview : marque la photo FAILED en cas d'erreur,
 * plutôt que de laisser planter l'appelant. */
export async function runPhotoProcessing(photoId: string): Promise<void> {
  try {
    await processPhotoPreview(photoId);
  } catch (error) {
    console.error(`[photo-processing] ${photoId} failed`, error);
    await prisma.photo.update({ where: { id: photoId }, data: { status: "FAILED" } });
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
