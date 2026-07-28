import sharp from "sharp";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { layoutWord, layoutMicro, ensureWatermarkFont, FONT_FAMILY, WORD_WEIGHT } from "./watermark-typography";
import { detectFaceZones, type FaceZone } from "./watermark-faces";

/**
 * Réglage de direction artistique — VERROUILLÉ. Ne pas arrondir, ne pas
 * "optimiser" : chaque valeur est arbitrée. Stack imposée : sharp (lecture,
 * rotation EXIF, redimensionnement, métadonnées, encodage mozjpeg) +
 * @napi-rs/canvas (dessin + métriques de texte — sharp ne mesure pas le
 * texte, et librsvg gère mal textLength/letter-spacing).
 */
const PARAMS = {
  opacity: 0.55,
  angleDeg: -22,
  fontRatio: 0.0179,
  // Tuile nominale / largeur image — valeur de référence documentée par le
  // brief ; la formule de tuile réelle (règle 1 ci-dessous) ne dépend que de
  // fontRatio/trackingFactor/wordWidthRatio et des bornes min/max.
  tileRatio: 0.183,
  tileRatioMin: 0.15,
  tileRatioMax: 0.26,
  trackingFactor: 1.32,
  wordWidthRatio: 0.7,
  wordWidthMax: 0.86,
  wordWeight: 500,
  wordMaxChars: 30,
  microText: "APERÇU",
  microSizeFactor: 0.46,
  microTracking: 1.55,
  microWidthMax: 0.62,
  microOpacity: 0.62,
  markRatio: 0.11,
  markOpacity: 0.85,
  faceAttenuation: 0.72,
  faceRadiusScale: 1.3,
  faceFeather: 0.52,
  lumaThreshold: 0.68,
  inkLight: "#ffffff",
  inkDark: "#0d0f12",
  previewMaxWidth: 1000,
  jpegQuality: 72,
} as const;

// Position des deux instances par cellule de maille — quinconce, jamais une
// grille orthogonale (l'alignement en colonnes trahit le filigrane bien plus
// que sa densité).
const MESH_SUBPOSITIONS: [number, number][] = [
  [0, 0],
  [0.5, 0.5],
];

function luma(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sampleLocalLuma(rgb: Buffer, width: number, height: number, channels: number, cx: number, cy: number, boxW: number, boxH: number): number {
  const x0 = Math.max(0, Math.floor(cx - boxW / 2));
  const x1 = Math.min(width, Math.ceil(cx + boxW / 2));
  const y0 = Math.max(0, Math.floor(cy - boxH / 2));
  const y1 = Math.min(height, Math.ceil(cy + boxH / 2));
  if (x1 <= x0 || y1 <= y0) return 0.5;

  const strideX = Math.max(1, Math.floor((x1 - x0) / 24));
  const strideY = Math.max(1, Math.floor((y1 - y0) / 24));
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += strideY) {
    for (let x = x0; x < x1; x += strideX) {
      const idx = (y * width + x) * channels;
      sum += luma(rgb[idx]!, rgb[idx + 1]!, rgb[idx + 2]!);
      count++;
    }
  }
  return count > 0 ? sum / count : 0.5;
}

function faceAttenuationAt(faces: FaceZone[], x: number, y: number): number {
  let multiplier = 1;
  for (const face of faces) {
    const d = Math.hypot(x - face.cx, y - face.cy);
    if (d >= face.radius) continue;
    const featherStart = PARAMS.faceFeather * face.radius;
    const localAtten = d <= featherStart ? PARAMS.faceAttenuation : PARAMS.faceAttenuation * (1 - (d - featherStart) / (face.radius - featherStart));
    multiplier = Math.min(multiplier, 1 - localAtten);
  }
  return multiplier;
}

const MARK_DOT_LOCAL_X = 0.22; // fraction de markSize, relative au centre du badge
const MARK_DOT_LOCAL_Y = -0.28;
const MARK_DOT_RADIUS_RATIO = 0.17;

/**
 * Symbole Linktrip miniaturisé : carré arrondi plein (remplissage seul,
 * jamais de contour), avec le point d'accent évidé (destination-out) dans
 * une passe séparée après coup — voir `punchMarkDots` plus bas :
 * @napi-rs/canvas n'applique pas correctement destination-out pour une forme
 * hors du pivot de rotation tant qu'une rotation est active sur le contexte
 * (vérifié : le canal alpha reste inchangé à l'endroit du trou), donc le
 * point ne peut pas être évidé pendant que l'instance est encore tournée.
 */
function drawMark(ctx: SKRSContext2D, size: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.32);
  ctx.fill();
  ctx.restore();
}

interface MarkDot {
  x: number;
  y: number;
  radius: number;
}

/** Position du point d'accent dans l'espace du canevas (post-rotation), pour la passe d'évidage différée. */
function markDotWorldPosition(screenX: number, screenY: number, tile: number, markSize: number, cos: number, sin: number): MarkDot {
  const localX = markSize * MARK_DOT_LOCAL_X;
  const localY = -0.175 * tile + markSize * MARK_DOT_LOCAL_Y;
  return {
    x: screenX + localX * cos - localY * sin,
    y: screenY + localX * sin + localY * cos,
    radius: markSize * MARK_DOT_RADIUS_RATIO,
  };
}

/** Évide tous les points d'accent en une seule passe, transform remise à l'identité (cf. drawMark). */
function punchMarkDots(ctx: SKRSContext2D, dots: MarkDot[]): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-out";
  for (const dot of dots) {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function buildWatermarkLayer(width: number, height: number, rgb: Buffer, channels: number, operatorName: string, faces: FaceZone[]): Buffer {
  ensureWatermarkFont();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const word = layoutWord(ctx, operatorName, width, PARAMS);
  const micro = layoutMicro(ctx, PARAMS.microText, word.fontSize, word.width, PARAMS);
  const tile = word.tile;
  const markSize = PARAMS.markRatio * tile;

  const angleRad = (PARAMS.angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const cx = width / 2;
  const cy = height / 2;

  // Débord nécessaire pour que la maille, une fois tournée, couvre encore
  // les coins du canevas.
  const rotatedW = Math.abs(width * cos) + Math.abs(height * sin);
  const rotatedH = Math.abs(width * sin) + Math.abs(height * cos);
  const marginX = Math.ceil((rotatedW - width) / 2) + tile;
  const marginY = Math.ceil((rotatedH - height) / 2) + tile;

  const colStart = Math.floor(-marginX / tile) - 1;
  const colEnd = Math.ceil((width + marginX) / tile) + 1;
  const rowStart = Math.floor(-marginY / tile) - 1;
  const rowEnd = Math.ceil((height + marginY) / tile) + 1;

  const markDots: MarkDot[] = [];

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      for (const [subX, subY] of MESH_SUBPOSITIONS) {
        const meshX = (col + subX) * tile;
        const meshY = (row + subY) * tile;
        const dx = meshX - cx;
        const dy = meshY - cy;
        const screenX = cx + dx * cos - dy * sin;
        const screenY = cy + dx * sin + dy * cos;

        if (screenX < -tile || screenX > width + tile || screenY < -tile || screenY > height + tile) continue;

        const localLuma = sampleLocalLuma(rgb, width, height, channels, screenX, screenY, word.width, tile * 0.4);
        const ink = localLuma > PARAMS.lumaThreshold ? PARAMS.inkDark : PARAMS.inkLight;
        const atten = faceAttenuationAt(faces, screenX, screenY);
        if (PARAMS.opacity * atten <= 0.002) continue;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(angleRad);

        ctx.save();
        ctx.translate(0, -0.175 * tile);
        ctx.globalAlpha = PARAMS.opacity * PARAMS.markOpacity * atten;
        drawMark(ctx, markSize, ink);
        ctx.restore();
        markDots.push(markDotWorldPosition(screenX, screenY, tile, markSize, cos, sin));

        ctx.fillStyle = ink;
        ctx.font = `${WORD_WEIGHT} ${word.fontSize}px ${FONT_FAMILY}`;
        ctx.letterSpacing = `${word.letterSpacingPx}px`;
        ctx.globalAlpha = PARAMS.opacity * atten;
        ctx.fillText(word.text, 0, 0.06 * tile);

        ctx.font = `${WORD_WEIGHT} ${micro.fontSize}px ${FONT_FAMILY}`;
        ctx.letterSpacing = `${micro.letterSpacingPx}px`;
        ctx.globalAlpha = PARAMS.opacity * PARAMS.microOpacity * atten;
        ctx.fillText(micro.text, 0, 0.135 * tile);

        ctx.restore();
      }
    }
  }

  punchMarkDots(ctx, markDots);

  return canvas.toBuffer("image/png");
}

/**
 * Aperçu de galerie de groupe : la seule protection des photos avant
 * paiement (brief §3 : jamais de flou, le client doit se reconnaître). Le
 * filigrane porte le nom du professionnel et le symbole Linktrip, atténué
 * localement autour des visages détectés pour rester lisible sans jamais
 * couvrir un visage entier.
 */
export async function generateGroupPreview(original: Buffer, operatorName: string): Promise<Buffer> {
  const { data: rgb, info } = await sharp(original)
    .rotate()
    .resize({ width: PARAMS.previewMaxWidth })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  const faces = await detectFaceZones(rgb, width, height, channels, PARAMS.faceRadiusScale).catch((error: unknown) => {
    console.error("[group-watermark] face detection failed, continuing without attenuation", error);
    return [] as FaceZone[];
  });

  const layer = buildWatermarkLayer(width, height, rgb, channels, operatorName, faces);

  return sharp(rgb, { raw: { width, height, channels } })
    .composite([{ input: layer, top: 0, left: 0 }])
    .jpeg({ quality: PARAMS.jpegQuality, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}
