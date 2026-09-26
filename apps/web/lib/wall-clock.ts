/**
 * Heure de prise de vue → instant réel.
 *
 * L'EXIF d'une photo (DateTimeOriginal) porte l'heure affichée par l'appareil,
 * sans fuseau : « 2026:09:20 14:03:12 ». Jusqu'au 26/09/2026 elle était
 * stockée telle quelle comme si c'était de l'UTC (14:03Z), puis affichée en
 * heure de Paris partout ailleurs : une sortie de 14 h apparaissait à 16 h en
 * été, et le rangement comparait ces heures décalées à Sortie.startsAt, qui
 * est, lui, un vrai instant.
 *
 * Désormais tout est un vrai instant : on applique le décalage écrit par
 * l'appareil quand il existe (OffsetTimeOriginal : iPhone, Android récents,
 * hybrides récents), sinon on lit l'heure comme une heure de Paris — le seul
 * fuseau du marché. Sans dépendance : tourne côté serveur et navigateur.
 */

const TZ = "Europe/Paris";

const parisParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Décalage de Paris sur UTC à cet instant, en minutes (+60 l'hiver, +120 l'été). */
export function parisOffsetMinutes(instant: Date): number {
  const parts = parisParts.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const whole = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - whole) / 60_000);
}

/** Une heure « au mur » à Paris → l'instant correspondant. */
export function parisWallClockToInstant(y: number, mo: number, d: number, h: number, mi: number, s: number): Date {
  const naive = Date.UTC(y, mo - 1, d, h, mi, s);
  // Deux passes : le décalage à retenir est celui de l'instant visé, qui peut
  // différer de celui de l'heure naïve la nuit du changement d'heure.
  const first = naive - parisOffsetMinutes(new Date(naive)) * 60_000;
  return new Date(naive - parisOffsetMinutes(new Date(first)) * 60_000);
}

/** Une vraie date, ni avant 2005 ni dans le futur (horloge d'appareil déréglée). */
export function plausibleTakenAt(d: Date): boolean {
  const t = d.getTime();
  return Number.isFinite(t) && d.getUTCFullYear() >= 2005 && t < Date.now() + 2 * 86_400_000;
}

/**
 * « 2026:09:20 14:03:12 » (+ « +02:00 » facultatif) → instant réel, ou null.
 * À lire avec exifr en `reviveValues: false` : revivre la date la place dans
 * le fuseau du processus (UTC sur Vercel, celui du téléphone dans le
 * navigateur), ce qui était la source du décalage.
 */
export function parseExifDateTime(raw: unknown, offsetRaw?: unknown): Date | null {
  if (typeof raw !== "string") return null;
  const m = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw.trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number) as [number, number, number, number, number, number];
  const off = typeof offsetRaw === "string" ? /^([+-])(\d{2}):?(\d{2})$/.exec(offsetRaw.trim()) : null;
  let date: Date;
  if (off) {
    const minutes = (off[1] === "-" ? -1 : 1) * (Number(off[2]) * 60 + Number(off[3]));
    date = new Date(Date.UTC(y, mo - 1, d, h, mi, s) - minutes * 60_000);
  } else {
    date = parisWallClockToInstant(y, mo, d, h, mi, s);
  }
  return plausibleTakenAt(date) ? date : null;
}

/** Les deux balises à demander à exifr. */
export const EXIF_TIME_TAGS = ["DateTimeOriginal", "OffsetTimeOriginal"];

/** Résultat d'exifr.parse(…, { pick: EXIF_TIME_TAGS, reviveValues: false }) → instant. */
export function takenAtFromExif(tags: unknown): Date | null {
  if (!tags || typeof tags !== "object") return null;
  const t = tags as { DateTimeOriginal?: unknown; OffsetTimeOriginal?: unknown };
  return parseExifDateTime(t.DateTimeOriginal, t.OffsetTimeOriginal);
}
