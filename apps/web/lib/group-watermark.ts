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
// Resserre le corps et la maille ensemble pour coller à la référence
// (retour utilisateur) — accepte en échange que les noms longs tronquent
// plus tôt sur un mot entier (règle 2, dégradation prévue par le brief,
// pas un bug : "Jet Côte d'Albatre" devient "Jet Côte…").
const SIZE_SCALE = 0.55;

const PARAMS = {
  // Plus sombre/opaque (retour utilisateur, deuxième passe : 0.55 puis 0.70
  // jugés encore trop clairs).
  opacity: 0.85,
  angleDeg: -22,
  fontRatio: 0.0179 * SIZE_SCALE,
  // Tuile FIXE (retour utilisateur : le quadrillage doit être identique sur
  // toutes les photos) — ne dépend plus de la longueur du nom. Avant, la
  // tuile était dérivée du nom (trackingFactor/wordWidthRatio/bornes
  // min-max), ce qui rendait le motif plus ou moins dense selon
  // l'opérateur ; maintenant seul le nom s'adapte à la tuile (interlettrage
  // puis troncature), jamais l'inverse.
  tileRatio: 0.26 * SIZE_SCALE,
  trackingFactor: 1.32,
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
  // Toujours blanc (retour utilisateur) : plus d'adaptation de teinte selon
  // la luminance locale.
  ink: "#ffffff",
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

function buildWatermarkLayer(width: number, height: number, operatorName: string, faces: FaceZone[]): Buffer {
  ensureWatermarkFont();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // La maille est dimensionnée sur le plus petit côté, pas sur la largeur :
  // toutes les images sortent de sharp à une largeur fixe (previewMaxWidth)
  // mais avec des hauteurs très différentes selon leur cadrage d'origine.
  // Or la grille de la galerie affiche chaque vignette dans une case CARRÉE
  // (object-fit: cover, collective.module.css) — le navigateur y met donc
  // à l'échelle chaque photo selon son côté le plus court. Baser la tuile
  // sur la largeur seule faisait paraître le filigrane bien plus "zoomé"
  // sur les photos au format paysage (mises à l'échelle davantage pour
  // remplir la case carrée) que sur les photos portrait. En basant la
  // tuile sur min(largeur, hauteur), sa taille à l'écran dans la vignette
  // carrée redevient la même quel que soit le cadrage d'origine.
  const meshBasis = Math.min(width, height);

  const word = layoutWord(ctx, operatorName, meshBasis, PARAMS);
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

        const ink = PARAMS.ink;
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

  const layer = buildWatermarkLayer(width, height, operatorName, faces);

  return sharp(rgb, { raw: { width, height, channels } })
    .composite([{ input: layer, top: 0, left: 0 }])
    .jpeg({ quality: PARAMS.jpegQuality, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}
