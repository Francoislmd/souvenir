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
  trackingFactor: number;
  wordWidthRatio: number;
  wordWidthMax: number;
  wordMaxChars: number;
  tileRatioMin: number;
  tileRatioMax: number;
}

/**
 * Règle 1 : le corps est constant (fontRatio × largeur image), la tuile
 * s'adapte au nom. Règle 2 : quand le nom ne rentre pas, ordre de
 * dégradation imposé — aérer la tuile (implicite : c'est le calcul nominal
 * tant qu'il reste sous tileRatioMax) → élargir la cible dans la tuile
 * (jusqu'à wordWidthMax) → tronquer sur un mot entier + "…" → réduire le
 * corps en tout dernier recours. Jamais d'interlettrage négatif à aucune
 * étape.
 */
export function layoutWord(ctx: SKRSContext2D, rawName: string, imageWidth: number, params: WordParams): WordLayout & { tile: number } {
  ensureWatermarkFont();
  const minTile = params.tileRatioMin * imageWidth;
  const maxTile = params.tileRatioMax * imageWidth;
  let fontSize = params.fontRatio * imageWidth;
  let text = truncateToMaxChars(rawName.toUpperCase(), params.wordMaxChars);

  for (let iteration = 0; iteration < 40; iteration++) {
    const naturalWidth = measureNatural(ctx, text, fontSize);
    const targetWidth = naturalWidth * params.trackingFactor;
    const tileRaw = targetWidth / params.wordWidthRatio;
    const charCount = Array.from(text).length;

    if (tileRaw <= maxTile) {
      // Aérer la tuile : le calcul nominal rentre déjà sous le plafond.
      const tile = Math.max(tileRaw, minTile);
      return { text, fontSize, letterSpacingPx: letterSpacingFor(targetWidth, naturalWidth, charCount), width: targetWidth, tile };
    }

    // Tuile plafonnée à tileRatioMax : élargir la cible dans la tuile.
    const widenedCeiling = params.wordWidthMax * maxTile;
    if (targetWidth <= widenedCeiling) {
      return { text, fontSize, letterSpacingPx: letterSpacingFor(targetWidth, naturalWidth, charCount), width: targetWidth, tile: maxTile };
    }
    if (naturalWidth <= widenedCeiling) {
      // Le mot tient à interlettrage nul sous le plafond élargi : on plafonne
      // l'interlettrage à 0 plutôt que de tronquer inutilement.
      return { text, fontSize, letterSpacingPx: 0, width: naturalWidth, tile: maxTile };
    }

    // Tronquer sur un mot entier.
    const shorter = dropLastWord(text);
    if (shorter) {
      text = `${shorter}…`;
      continue;
    }

    // Dernier recours : réduire le corps.
    fontSize *= 0.94;
  }

  const naturalWidth = measureNatural(ctx, text, fontSize);
  return { text, fontSize, letterSpacingPx: 0, width: naturalWidth, tile: maxTile };
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
