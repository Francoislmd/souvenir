/**
 * Ce que le navigateur de l'opérateur lit d'une vidéo au moment du dépôt :
 * une vignette (image tirée de la vidéo), sa durée et son heure de tournage.
 *
 * C'est ici, et pas sur le serveur, que la vidéo est décodée : le navigateur
 * sait lire les formats des caméras (H.264, et HEVC sur Mac/iPhone), le
 * serveur n'aurait su le faire qu'avec ffmpeg sur Vercel, et en téléchargeant
 * chaque vidéo entière dans la fonction. La vignette part ensuite avec la
 * vidéo et le serveur la traite comme une photo (lib/photo-processing.ts).
 *
 * Tout est au mieux : un échec rend `null`, jamais une erreur. Une vidéo
 * sans vignette reçoit une image de repli côté serveur, une vidéo sans heure
 * rejoint le créneau des photos sans EXIF.
 */

export interface VideoProbe {
  poster: Blob | null;
  durationSec: number | null;
  /** ISO. Même convention que l'EXIF des photos lu sur le serveur : l'heure
   *  affichée par la caméra, écrite comme si c'était de l'UTC (voir wallClock). */
  takenAt: string | null;
}

const MAC_EPOCH_OFFSET_SEC = 2082844800; // 1904-01-01 → 1970-01-01
const MAX_MOOV_BYTES = 32 * 1024 * 1024;
const POSTER_MAX_WIDTH = 1600;
const STEP_TIMEOUT_MS = 15_000;

// Une vidéo à la fois : chaque sonde ouvre un lecteur et décode une image,
// en lancer vingt de front (une carte mémoire vidée d'un coup) figerait la page.
let chain: Promise<unknown> = Promise.resolve();

export function probeVideo(file: Blob, lastModified?: number): Promise<VideoProbe> {
  const run = chain.then(() => probeNow(file, lastModified));
  chain = run.catch(() => undefined);
  return run;
}

async function probeNow(file: Blob, lastModified?: number): Promise<VideoProbe> {
  const [meta, frame] = await Promise.all([readMp4Meta(file).catch(() => null), capturePoster(file).catch(() => null)]);
  const durationSec = frame?.durationSec ?? meta?.durationSec ?? null;
  const taken = meta?.takenAt ?? (lastModified ? wallClock(new Date(lastModified)) : null);
  return { poster: frame?.poster ?? null, durationSec, takenAt: taken ? taken.toISOString() : null };
}

/**
 * Le serveur lit l'EXIF des photos (DateTimeOriginal, sans fuseau) dans le
 * fuseau de Vercel, UTC : 10 h 00 à l'appareil devient 10:00Z. Pour qu'une
 * vidéo tombe dans le même créneau que les photos prises au même moment, son
 * heure suit la même convention : l'heure locale, écrite en UTC.
 */
export function wallClock(instant: Date): Date {
  return new Date(instant.getTime() - instant.getTimezoneOffset() * 60_000);
}

function plausible(d: Date): boolean {
  const t = d.getTime();
  return Number.isFinite(t) && d.getUTCFullYear() >= 2005 && t < Date.now() + 2 * 86_400_000;
}

// ---- Métadonnées MP4 / QuickTime (boîte moov → mvhd) ----

async function readBytes(blob: Blob, start: number, length: number): Promise<DataView> {
  const buf = await blob.slice(start, start + length).arrayBuffer();
  return new DataView(buf);
}

function fourcc(view: DataView, at: number): string {
  return String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
}

function u64(view: DataView, at: number): number {
  return view.getUint32(at) * 2 ** 32 + view.getUint32(at + 4);
}

/** Trouve la boîte moov en ne lisant que les en-têtes (16 octets par boîte) :
 *  elle est souvent à la fin du fichier, après des centaines de Mo d'images. */
async function findMoov(blob: Blob): Promise<{ start: number; size: number } | null> {
  let offset = 0;
  for (let i = 0; i < 64 && offset + 8 <= blob.size; i++) {
    const head = await readBytes(blob, offset, 16);
    if (head.byteLength < 8) return null;
    let size = head.getUint32(0);
    const type = fourcc(head, 4);
    let header = 8;
    if (size === 1) {
      if (head.byteLength < 16) return null;
      size = u64(head, 8);
      header = 16;
    } else if (size === 0) {
      size = blob.size - offset;
    }
    if (size < header) return null;
    if (type === "moov") return { start: offset + header, size: size - header };
    offset += size;
  }
  return null;
}

export interface Mp4Meta {
  takenAt: Date | null;
  durationSec: number | null;
}

export async function readMp4Meta(blob: Blob): Promise<Mp4Meta | null> {
  const moov = await findMoov(blob);
  if (!moov || moov.size > MAX_MOOV_BYTES) return null;
  const view = await readBytes(blob, moov.start, moov.size);
  return parseMoov(view);
}

/** Exporté pour les tests : le contenu d'une boîte moov (sans son en-tête). */
export function parseMoov(view: DataView): Mp4Meta {
  let takenAt: Date | null = null;
  let durationSec: number | null = null;

  let offset = 0;
  while (offset + 8 <= view.byteLength) {
    const size = view.getUint32(offset);
    const type = fourcc(view, offset + 4);
    if (size < 8) break;
    if (type === "mvhd" && offset + 32 <= view.byteLength) {
      const body = offset + 8;
      const version = view.getUint8(body);
      let created: number;
      let timescale: number;
      let duration: number;
      if (version === 1) {
        created = u64(view, body + 4);
        timescale = view.getUint32(body + 20);
        duration = u64(view, body + 24);
      } else {
        created = view.getUint32(body + 4);
        timescale = view.getUint32(body + 12);
        duration = view.getUint32(body + 16);
      }
      if (timescale > 0 && duration > 0) durationSec = duration / timescale;
      // mvhd est en UTC selon la norme, mais les caméras d'action (GoPro)
      // y écrivent l'heure locale : c'est justement la convention voulue
      // (wallClock). Les iPhone, eux, y mettent le vrai UTC — mais ils
      // portent aussi la date Apple ci-dessous, prioritaire.
      if (created > MAC_EPOCH_OFFSET_SEC) {
        const d = new Date((created - MAC_EPOCH_OFFSET_SEC) * 1000);
        if (plausible(d)) takenAt = d;
      }
      break;
    }
    offset += size;
  }

  // iPhone : com.apple.quicktime.creationdate, « 2026-09-05T10:02:11+0200 ».
  // L'heure locale est écrite telle quelle, avec son décalage : on garde
  // l'heure locale (wallClock), sans appliquer le décalage.
  const text = latin1(view);
  // Seulement la forme avec décalage : une date en « Z » (écrite par
  // certains logiciels à côté) est de l'UTC, pas l'heure affichée.
  const apple = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})[+-]\d{2}:?\d{2}/.exec(text);
  if (apple) {
    const [, y, mo, d, h, mi, s] = apple.map(Number) as [number, number, number, number, number, number, number];
    const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
    if (plausible(date)) takenAt = date;
  }

  return { takenAt, durationSec };
}

function latin1(view: DataView): string {
  return new TextDecoder("latin1").decode(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
}

// ---- Vignette ----

function waitFor(el: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`timeout ${event}`));
    }, STEP_TIMEOUT_MS);
    const ok = (): void => {
      cleanup();
      resolve();
    };
    const ko = (): void => {
      cleanup();
      reject(new Error("video error"));
    };
    function cleanup(): void {
      clearTimeout(timer);
      el.removeEventListener(event, ok);
      el.removeEventListener("error", ko);
    }
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", ko, { once: true });
  });
}

async function capturePoster(file: Blob): Promise<{ poster: Blob | null; durationSec: number | null }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    video.src = url;
    await waitFor(video, "loadedmetadata");
    const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null;
    if (!video.videoWidth || !video.videoHeight) return { poster: null, durationSec };

    // Pas la toute première image : souvent noire (fondu, doigt sur
    // l'objectif, caméra qui démarre). Un peu plus loin, sans dépasser 3 s.
    const target = durationSec ? Math.min(3, Math.max(0.5, durationSec * 0.2), Math.max(0, durationSec - 0.1)) : 0.5;
    video.currentTime = target;
    await waitFor(video, "seeked");

    const scale = Math.min(1, POSTER_MAX_WIDTH / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { poster: null, durationSec };
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return { poster, durationSec };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
