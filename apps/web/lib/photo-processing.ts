import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import sharp from "sharp";
import exifr from "exifr";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { ORIGINALS_BUCKET, PREVIEWS_BUCKET, downloadObject, uploadObject } from "./storage";
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
 * flouté pour l'email et aperçu filigrané tuilé verrouillé (galerie de groupe
 * comme galerie individuelle), lit l'heure de prise de vue, puis passe son
 * statut à READY (ou FAILED en cas d'échec).
 *
 * Depuis le 19/09/2026, tout ce dont la publication d'une sortie GROUPE a
 * besoin est prêt ici : elle n'a plus qu'à ranger les photos par créneau
 * (lib/group-publish.ts). Avant, elle retéléchargeait et redécodait chaque
 * original — une à deux minutes d'attente sur une sortie de 40 photos, pour
 * un travail que le dépôt venait de faire en tâche de fond.
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
    // Une vidéo n'est jamais décodée ici : tout part de sa vignette, tirée
    // par le navigateur au dépôt (lib/media.ts). Sans vignette (format que le
    // navigateur ne savait pas lire, envoi raté), une image de repli est
    // posée à sa place pour que la vidéo reste visible et vendable.
    const originalBuffer = photo.isVideo
      ? await loadVideoPoster(photo.id, photo.sortieId, photo.posterKey)
      : await downloadOriginalBuffer(photo.originalKey);
    const inputPath = join(dir, "input");
    await writeFile(inputPath, originalBuffer);

    // L'aperçu de galerie part tout de suite, en parallèle des autres
    // dérivés : c'est le plus long (flou + trame de noms + mozjpeg).
    // Un échec ici ne coûte pas la photo : sans aperçu, la publication le
    // refera (lib/group-publish.ts), comme le rattrapage des galeries.
    const groupPreviewPending = generateGroupPreview(originalBuffer, operator.name).catch((error: unknown) => {
      console.error(`[photo-processing] ${photoId} group preview failed`, error);
      return null;
    });
    // Heure de prise de vue, pour le rangement par créneau à la publication.
    // Stockée brute : la publication écarte celles qui ne tombent pas le jour
    // de la sortie (lib/group-publish.ts).
    // Vidéo : l'heure a été lue par le navigateur au dépôt (la vignette n'a
    // pas d'EXIF) — on garde celle de la fiche.
    const exif = photo.isVideo ? null : await exifr.parse(originalBuffer, ["DateTimeOriginal"]).catch(() => null);
    const takenAtRaw: unknown = exif?.DateTimeOriginal;
    const takenAt = photo.isVideo
      ? photo.takenAt
      : takenAtRaw instanceof Date && !Number.isNaN(takenAtRaw.getTime())
        ? takenAtRaw
        : null;

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
    await uploadObject(PREVIEWS_BUCKET, thumbKey, thumbBuffer, { contentType: "image/jpeg" });
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

    // Les deux modes : en GROUPE, c'est l'aperçu que la boutique servira dès
    // la publication, qui n'a donc plus à le calculer. cacheControl court :
    // la clé peut être réécrite en place (même règle que lib/group-publish.ts).
    const groupPreviewBuffer = await groupPreviewPending;
    const groupPreviewKey = groupPreviewBuffer ? `${photoId}/group-preview.jpg` : null;

    await Promise.all([
      uploadObject(PREVIEWS_BUCKET, previewKey, previewBuffer, { contentType: "image/jpeg" }),
      uploadObject(PREVIEWS_BUCKET, blurEmailKey, blurEmailBuffer, { contentType: "image/jpeg" }),
      groupPreviewKey && groupPreviewBuffer
        ? uploadObject(PREVIEWS_BUCKET, groupPreviewKey, groupPreviewBuffer, { contentType: "image/jpeg", cacheControl: "public, max-age=60" })
        : Promise.resolve(),
    ]);

    await prisma.photo.update({
      where: { id: photoId },
      // groupPreviewKey omis (plutôt que mis à null) si son rendu a échoué :
      // un retry ne doit pas effacer un aperçu déjà posé par la publication.
      data: { thumbKey, previewKey, blurEmailKey, takenAt, status: "READY", ...(groupPreviewKey ? { groupPreviewKey } : {}) },
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

async function downloadOriginalBuffer(key: string): Promise<Buffer> {
  return downloadObject(ORIGINALS_BUCKET, key);
}

/**
 * La vignette d'une vidéo, ou à défaut une image de repli (fond sombre,
 * triangle de lecture) enregistrée à sa place : le
 * reste du traitement, la publication et le rattrapage des aperçus
 * (imageSourceKeyOf) la lisent ensuite comme n'importe quelle vignette.
 */
async function loadVideoPoster(photoId: string, sortieId: string, posterKey: string | null): Promise<Buffer> {
  if (posterKey) {
    try {
      const buffer = await downloadOriginalBuffer(posterKey);
      // Une vignette vide ou corrompue ne doit pas faire échouer la vidéo.
      await sharp(buffer).metadata();
      return buffer;
    } catch (error) {
      console.warn(`[photo-processing] ${photoId} video poster missing, using fallback`, error);
    }
  }
  const key = posterKey ?? `${sortieId}/${photoId}-poster.jpg`;
  const buffer = await sharp(Buffer.from(fallbackPosterSvg())).jpeg({ quality: 86 }).toBuffer();
  await uploadObject(ORIGINALS_BUCKET, key, buffer, { contentType: "image/jpeg" });
  if (!posterKey) await prisma.photo.update({ where: { id: photoId }, data: { posterKey: key } });
  return buffer;
}

// Pas de texte : Vercel n'a pas de polices système pour librsvg, un libellé
// sortirait en carrés. Le nom du professionnel arrive de toute façon avec le
// filigrane des aperçus.
function fallbackPosterSvg(): string {
  return `<svg width="1600" height="1200" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2838"/><stop offset="1" stop-color="#141320"/></linearGradient></defs>
  <rect width="1600" height="1200" fill="url(#g)"/>
  <circle cx="800" cy="560" r="120" fill="rgba(255,255,255,0.12)"/>
  <path d="M760 490 L880 560 L760 630 Z" fill="#ffffff"/>
</svg>`;
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
