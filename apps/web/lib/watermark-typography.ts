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

export interface WordLayout {
  text: string;
  fontSize: number;
  letterSpacingPx: number;
  /** Largeur réellement rendue (avec interlettrage), en px. */
  width: number;
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

function letterSpacingFor(finalWidth: number, naturalWidth: number, charCount: number): number {
  // Règle : interlettrage jamais négatif.
  return Math.max(0, (finalWidth - naturalWidth) / Math.max(1, charCount));
}

export interface WordParams {
  fontRatio: number;
  tileRatio: number;
  trackingFactor: number;
  wordWidthMax: number;
  wordMaxChars: number;
}

/**
 * Corps et tuile constants (fontRatio/tileRatio × largeur image) — jamais
 * dérivés du nom, pour garantir la même maille sur toutes les photos, quel
 * que soit l'opérateur ou la longueur de son nom (retour utilisateur :
 * quadrillage identique partout). Seul le nom s'adapte à la tuile, jamais
 * l'inverse : interlettrage étendu jusqu'à wordWidthMax, puis troncature
 * sur un mot entier + "…", puis réduction du corps en tout dernier
 * recours (seul cas où une photo peut différer des autres — un nom
 * pathologiquement long qui ne tient même pas tronqué). Jamais
 * d'interlettrage négatif.
 */
export function layoutWord(ctx: SKRSContext2D, rawName: string, imageWidth: number, params: WordParams): WordLayout & { tile: number } {
  ensureWatermarkFont();
  const tile = params.tileRatio * imageWidth;
  let fontSize = params.fontRatio * imageWidth;
  let text = truncateToMaxChars(rawName.toUpperCase(), params.wordMaxChars);

  for (let iteration = 0; iteration < 40; iteration++) {
    const naturalWidth = measureNatural(ctx, text, fontSize);
    const targetWidth = naturalWidth * params.trackingFactor;
    const ceiling = params.wordWidthMax * tile;
    const charCount = Array.from(text).length;

    if (targetWidth <= ceiling) {
      return { text, fontSize, letterSpacingPx: letterSpacingFor(targetWidth, naturalWidth, charCount), width: targetWidth, tile };
    }
    if (naturalWidth <= ceiling) {
      // Le mot tient à interlettrage nul sous le plafond : on plafonne
      // l'interlettrage à 0 plutôt que de tronquer inutilement.
      return { text, fontSize, letterSpacingPx: 0, width: naturalWidth, tile };
    }

    // Tronquer sur un mot entier.
    const shorter = dropLastWord(text);
    if (shorter) {
      text = `${shorter}…`;
      continue;
    }

    // Dernier recours : réduire le corps (seul cas où la maille peut
    // différer d'une photo à l'autre — nom pathologique, cf. docstring).
    fontSize *= 0.94;
  }

  const naturalWidth = measureNatural(ctx, text, fontSize);
  return { text, fontSize, letterSpacingPx: 0, width: naturalWidth, tile };
}

export interface MicroParams {
  microSizeFactor: number;
  microTracking: number;
  microWidthMax: number;
}

export function layoutMicro(ctx: SKRSContext2D, microText: string, nameFontSize: number, nameWidth: number, params: MicroParams): WordLayout {
  ensureWatermarkFont();
  const fontSize = params.microSizeFactor * nameFontSize;
  const naturalWidth = measureNatural(ctx, microText, fontSize);
  const targetWidth = naturalWidth * params.microTracking;
  const ceiling = params.microWidthMax * nameWidth;
  // max(natural, min(target, ceiling)) : respecte le plafond quand
  // l'interlettrage seul en est la cause, mais n'exige jamais un
  // interlettrage négatif si la largeur naturelle dépasse déjà le plafond.
  const finalWidth = Math.max(naturalWidth, Math.min(targetWidth, ceiling));
  const charCount = Array.from(microText).length;
  return { text: microText, fontSize, letterSpacingPx: letterSpacingFor(finalWidth, naturalWidth, charCount), width: finalWidth };
}
