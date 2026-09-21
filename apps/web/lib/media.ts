/**
 * Ce qui distingue une vidéo d'une photo, partagé entre le navigateur et le
 * serveur (aucun import serveur ici).
 *
 * Une vidéo est une ligne `Photo` comme les autres (isVideo = true) : même
 * prix, même panier, même galerie, même purge. Tout ce qui s'affiche avant
 * l'achat vient de sa vignette (`posterKey`), une image tirée de la vidéo
 * par le navigateur de l'opérateur au dépôt (lib/video-probe.ts) : le
 * serveur la traite exactement comme une photo (miniature, filigrane, flou
 * email). Aucune vidéo n'est décodée côté serveur, donc pas de ffmpeg et
 * rien de plus sur Vercel (CLAUDE.md §2).
 */

/** Formats qu'un navigateur sait lire : MP4 (GoPro, DJI, Android), MOV (iPhone), WebM. */
export const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v", "webm"] as const;

/**
 * Plafond par vidéo, en mégaoctets. R2 accepte 5 Go par envoi, mais tout
 * le stockage gratuit tient en 9 Go (lib/storage-quota.ts) : 500 Mo, c'est
 * déjà cinq minutes de 1080p et 5 % de la place totale.
 */
export const MAX_VIDEO_MB = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_MB) || 500;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
/** Une photo, même RAW : au-delà, c'est une erreur de fichier. */
export const MAX_PHOTO_BYTES = 150 * 1024 * 1024;

export function extensionOf(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match ? match[1]!.toLowerCase() : "";
}

export function isVideoFilename(filename: string): boolean {
  return (VIDEO_EXTENSIONS as readonly string[]).includes(extensionOf(filename));
}

/** Un fichier déposé est une vidéo si le navigateur le dit, ou son extension. */
export function isVideoFile(file: { type: string; name?: string }): boolean {
  if (file.type.startsWith("video/")) return true;
  return file.name ? isVideoFilename(file.name) : false;
}

/** « 0:42 », « 12:05 ». */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Les fichiers d'origine d'une ligne Photo (bucket `originals`) : la vidéo et sa vignette. */
export function originalKeysOf(photo: { originalKey: string; posterKey?: string | null }): string[] {
  return photo.posterKey ? [photo.originalKey, photo.posterKey] : [photo.originalKey];
}

/** Toutes les dérivées d'une ligne Photo (bucket `previews`, public). */
export function previewKeysOf(photo: {
  previewKey: string | null;
  thumbKey: string | null;
  blurEmailKey: string | null;
  groupPreviewKey: string | null;
}): string[] {
  return [photo.previewKey, photo.thumbKey, photo.blurEmailKey, photo.groupPreviewKey].filter((k): k is string => !!k);
}

/** L'image d'où partent aperçus et filigranes : la vignette pour une vidéo, l'original pour une photo. */
export function imageSourceKeyOf(photo: { originalKey: string; isVideo?: boolean; posterKey?: string | null }): string {
  return photo.isVideo && photo.posterKey ? photo.posterKey : photo.originalKey;
}
