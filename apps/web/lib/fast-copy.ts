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
  /** DateTimeOriginal, heure de l'appareil écrite en UTC (même convention
   *  que le serveur et lib/video-probe.ts). */
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

/** « 2026:09:20 10:03:12 » → 2026-09-20T10:03:12.000Z. Lu en chaîne brute :
 *  revivre la date dans le fuseau du téléphone la décalerait de deux heures
 *  par rapport aux photos lues par le serveur. */
export async function readTakenAt(file: Blob): Promise<string | null> {
  try {
    const exifr = (await import("exifr")).default;
    const tags = (await exifr.parse(file, { pick: ["DateTimeOriginal"], reviveValues: false })) as { DateTimeOriginal?: unknown } | undefined;
    const raw = tags?.DateTimeOriginal;
    if (typeof raw !== "string") return null;
    const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw.trim());
    if (!m) return null;
    const date = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!));
    const year = date.getUTCFullYear();
    return Number.isFinite(date.getTime()) && year >= 2005 && date.getTime() < Date.now() + 2 * 86_400_000 ? date.toISOString() : null;
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
