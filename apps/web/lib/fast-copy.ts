/**
 * La copie de travail d'une photo, faite par le navigateur de l'opérateur
 * avant tout envoi (lib/media.ts, `posterKey`).
 *
 * Pourquoi : une photo de téléphone pèse 3 à 12 Mo (48 Mpx sur un iPhone
 * récent). Cinquante photos en 4G, c'est cinq à dix minutes d'envoi, et
 * tout ce temps la sortie ne pouvait pas être publiée. La copie de travail
 * (2048 px, 300 à 700 Ko) suffit à tout ce que le serveur fabrique
 * (miniature 480, aperçus 1280, filigrane) : elle part d'abord, la sortie
 * est publiable en une minute, et l'original suit en tâche de fond pour la
 * livraison (UploadQueueProvider, phase HD).
 *
 * Tout échec (HEIC que le navigateur ne sait pas décoder, mémoire) rend
 * null : la photo part alors comme avant, original en premier.
 */

import { EXIF_TIME_TAGS, takenAtFromExif } from "./wall-clock";

const MAX_EDGE = 2048;
const QUALITY = 0.84;
const THUMB_EDGE = 360;
/** En dessous, l'original est déjà assez léger pour partir tel quel. */
const MIN_BYTES = 900 * 1024;
const TIMEOUT_MS = 20_000;

export interface FastCopy {
  /** Copie de travail JPEG, ou null si l'original part tel quel. */
  work: Blob | null;
  /** Petite vignette locale pour la grille : décoder 50 photos de 12 Mpx
   *  dans des <img> suffit à faire recharger l'onglet sur un iPhone. */
  thumb: Blob | null;
  /** Instant réel de prise de vue (lib/wall-clock.ts), comme le serveur. */
  takenAt: string | null;
}

// Deux photos à la fois, dans l'ordre du dépôt : une seule laisse le
// processeur à moitié vide (0,3 à 0,6 s par photo de 12 Mpx sur téléphone,
// mesuré en Chromium bridé ×4), trois décodages de 48 Mpx dépasseraient la
// mémoire qu'iOS laisse à un onglet.
const PARALLEL = 2;
let active = 0;
const waiting: (() => void)[] = [];

async function slot<T>(task: () => Promise<T>): Promise<T> {
  // La place est passée de main en main : jamais plus de PARALLEL à la fois.
  if (active >= PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve));
  else active += 1;
  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  }
}

export function makeFastCopy(file: Blob): Promise<FastCopy> {
  return slot(() => withTimeout(build(file), TIMEOUT_MS)).catch(() => ({ work: null, thumb: null, takenAt: null }));
}

async function build(file: Blob): Promise<FastCopy> {
  const takenAt = await readTakenAt(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { work: null, thumb: null, takenAt };
  }
  try {
    const longEdge = Math.max(bitmap.width, bitmap.height);
    const base = downscale(bitmap, Math.min(1, MAX_EDGE / longEdge));
    const work = file.size >= MIN_BYTES ? await encode(base, QUALITY) : null;
    // La vignette part de la copie 2048, pas de l'original : la tirer de
    // l'original coûtait autant que la copie elle-même.
    const thumb = await encode(downscale(base, Math.min(1, THUMB_EDGE / Math.max(base.width, base.height))), 0.7);
    // Une copie qui ne fait pas gagner au moins un tiers ne vaut pas un
    // second envoi.
    return { work: work && work.size < file.size * 0.66 ? work : null, thumb, takenAt };
  } finally {
    bitmap.close();
  }
}

/**
 * La vignette que l'appareil photo a rangée dans l'EXIF (160 à 320 px), lue
 * dans les premiers kilo-octets du fichier, sans décoder la photo : la
 * grille a une image légère en quelques millisecondes. Sans elle, les
 * premières secondes affichaient les originaux eux-mêmes — une cinquantaine
 * de photos de 12 Mpx décodées d'un coup, ce qui fait recharger l'onglet d'un
 * iPhone.
 *
 * Remise droite ici (elle n'a pas d'EXIF à elle), et écartée si son cadrage
 * ne suit pas celui de la photo : certains boîtiers la bordent de noir.
 */
export async function quickThumb(file: Blob): Promise<Blob | null> {
  try {
    const exifr = (await import("exifr")).default;
    const [data, tags] = await Promise.all([
      exifr.thumbnail(file),
      exifr.parse(file, { pick: ["Orientation", "ExifImageWidth", "ExifImageHeight"], translateValues: false }) as Promise<
        { Orientation?: number; ExifImageWidth?: number; ExifImageHeight?: number } | undefined
      >,
    ]);
    if (!data || data.byteLength < 1000) return null;
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type: "image/jpeg" }));
    try {
      const orientation = tags?.Orientation ?? 1;
      const turned = orientation >= 5 && orientation <= 8;
      const w = turned ? bitmap.height : bitmap.width;
      const h = turned ? bitmap.width : bitmap.height;
      const fullW = turned ? tags?.ExifImageHeight : tags?.ExifImageWidth;
      const fullH = turned ? tags?.ExifImageWidth : tags?.ExifImageHeight;
      if (fullW && fullH && Math.abs(w / h - fullW / fullH) > 0.04) return null;
      const surface = canvas(w, h);
      const ctx = surface.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      if (!ctx) return null;
      // Les huit orientations EXIF, ramenées au sens de lecture.
      const transforms: Record<number, [number, number, number, number, number, number]> = {
        2: [-1, 0, 0, 1, w, 0],
        3: [-1, 0, 0, -1, w, h],
        4: [1, 0, 0, -1, 0, h],
        5: [0, 1, 1, 0, 0, 0],
        6: [0, 1, -1, 0, w, 0],
        7: [0, -1, -1, 0, w, h],
        8: [0, -1, 1, 0, 0, h],
      };
      const t = transforms[orientation];
      if (t) ctx.setTransform(...t);
      ctx.drawImage(bitmap, 0, 0);
      return await encode(surface, 0.8);
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}

type Surface = HTMLCanvasElement | OffscreenCanvas;

function canvas(width: number, height: number): Surface {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  return el;
}

/** Réduction par moitiés successives : en une seule passe, un 8000 px
 *  ramené à 2048 crénelle les détails fins (feuillages, cheveux). */
function downscale(source: ImageBitmap | Surface, scale: number): Surface {
  let w = source.width;
  let h = source.height;
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));
  let current: ImageBitmap | Surface = source;
  if (scale === 1 && !(source instanceof ImageBitmap)) return source;
  while (w / 2 >= targetW * 1.2) {
    w = Math.round(w / 2);
    h = Math.round(h / 2);
    current = draw(current, w, h);
  }
  return draw(current, targetW, targetH);
}

function draw(source: CanvasImageSource, width: number, height: number): Surface {
  const surface = canvas(width, height);
  const ctx = surface.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("no 2d context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return surface;
}

function encode(surface: Surface, quality: number): Promise<Blob> {
  if ("convertToBlob" in surface) return surface.convertToBlob({ type: "image/jpeg", quality });
  return new Promise((resolve, reject) =>
    surface.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/jpeg", quality),
  );
}

/** « 2026:09:20 14:03:12 » → l'instant réel (14:03 à Paris = 12:03Z en été),
 *  lu en chaîne brute pour ne pas dépendre du fuseau du téléphone. */
export async function readTakenAt(file: Blob): Promise<string | null> {
  try {
    const exifr = (await import("exifr")).default;
    const tags = await exifr.parse(file, { pick: EXIF_TIME_TAGS, reviveValues: false });
    return takenAtFromExif(tags)?.toISOString() ?? null;
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
