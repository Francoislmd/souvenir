import { GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import { WATERMARK_FONT_WOFF_BASE64 } from "./fonts/watermark-font";

export const FONT_FAMILY = "SouvenirWatermark";
export const WORD_WEIGHT = 500;

let fontRegistered = false;
export function ensureWatermarkFont(): void {
  if (fontRegistered) return;
  GlobalFonts.register(Buffer.from(WATERMARK_FONT_WOFF_BASE64, "base64"), FONT_FAMILY);
  fontRegistered = true;
}

export interface RunLayout {
  text: string;
  fontSize: number;
  letterSpacingPx: number;
  /** Longueur réellement rendue du nom (interlettrage compris), en px. */
  run: number;
}

function measureNatural(ctx: SKRSContext2D, text: string, fontSize: number): number {
  ctx.font = `${WORD_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
  ctx.letterSpacing = "0px";
  return ctx.measureText(text).width;
}

function truncateToMaxChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const words = text.split(/\s+/).filter(Boolean);
  while (words.length > 1) {
    words.pop();
    const candidate = `${words.join(" ")}…`;
    if (candidate.length <= maxChars) return candidate;
  }
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

function dropLastWord(text: string): string | null {
  const base = text.endsWith("…") ? text.slice(0, -1).trimEnd() : text;
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return null;
  words.pop();
  return words.join(" ");
}

export interface RunParams {
  fontRatio: number;
  tracking: number;
  runMax: number;
  maxChars: number;
}

/**
 * Le nom écrit d'un trait, à l'horizontale, pour une rangée du filigrane.
 *
 * Le corps est FIXE (fontRatio × côté court) : c'est lui qui garantit la même
 * maille sur toutes les photos, quel que soit l'opérateur — reprise de la
 * règle arbitrée précédemment ("seul le nom s'adapte, jamais la maille").
 * Ce qui varie avec le nom, c'est la LONGUEUR de la rangée, ce qui est
 * inévitable pour du texte horizontal : un nom court écrit plus court se
 * répète simplement plus souvent dans la largeur.
 *
 * Le nom n'est JAMAIS étiré pour atteindre une longueur cible : un nom court
 * s'écrit court et se répète simplement plus souvent dans la rangée. Étirer
 * "Ki" sur la moitié de la photo donnait "K     i", illisible comme marque.
 * L'interlettrage se limite donc à `tracking`, une respiration constante.
 *
 * Seule borne : runMax. Au-delà, une occurrence traverserait toute la photo
 * et le motif disparaîtrait — on tronque alors sur un mot entier + "…", puis
 * on réduit le corps en tout dernier recours (seul cas où la maille peut
 * différer d'une photo à l'autre : un nom pathologiquement long).
 */
export function layoutRun(ctx: SKRSContext2D, rawName: string, basis: number, params: RunParams): RunLayout {
  ensureWatermarkFont();
  let fontSize = params.fontRatio * basis;
  let text = truncateToMaxChars(rawName.trim(), params.maxChars);
  const ceiling = params.runMax * basis;

  for (let iteration = 0; iteration < 40; iteration++) {
    const naturalWidth = measureNatural(ctx, text, fontSize);
    const charCount = Array.from(text).length;

    if (naturalWidth <= ceiling) {
      const run = Math.min(ceiling, naturalWidth * params.tracking);
      return { text, fontSize, letterSpacingPx: Math.max(0, (run - naturalWidth) / Math.max(1, charCount)), run };
    }

    const shorter = dropLastWord(text);
    if (shorter) {
      text = `${shorter}…`;
      continue;
    }
    fontSize *= 0.94;
  }

  const naturalWidth = measureNatural(ctx, text, fontSize);
  return { text, fontSize, letterSpacingPx: 0, run: naturalWidth };
}
