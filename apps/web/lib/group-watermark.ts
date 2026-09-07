import sharp from "sharp";
import { createCanvas } from "@napi-rs/canvas";
import { layoutRun, ensureWatermarkFont, FONT_FAMILY, WORD_WEIGHT } from "./watermark-typography";
import { detectFaceZones, type FaceZone } from "./watermark-faces";

/**
 * Réglage de direction artistique — VERROUILLÉ. Ne pas arrondir, ne pas
 * "optimiser" : chaque valeur a été arbitrée sur des rendus comparés côte à
 * côte, colonne par colonne, un seul paramètre changeant à la fois.
 *
 * La composition, en trois couches :
 *   1. la photo, nette, jusqu'au bord ;
 *   2. une PLAQUE insérée d'une marge (bandRatio), à coins arrondis, qui
 *      floute très légèrement ce qu'elle couvre et l'assombrit d'un voile ;
 *   3. le nom du professionnel écrit en grand, à l'horizontale, répété en
 *      rangées décalées d'une demi-longueur.
 *
 * Ce qui fait l'objet, c'est le CONTRASTE entre la plaque et la bande nette
 * qui l'entoure : le bord garde la lumière et le piqué de la photo, le centre
 * est traité. Sans cette bande, on ne voit qu'une photo barrée ; avec elle,
 * une photo présentée.
 *
 * Stack imposée : sharp (lecture, rotation EXIF, redimensionnement, flou,
 * découpe, encodage mozjpeg) + @napi-rs/canvas (dessin + métriques de texte —
 * sharp ne mesure pas le texte, et librsvg gère mal l'interlettrage).
 */
const PARAMS = {
  // --- La plaque ---------------------------------------------------------
  // Marge nette tout autour, en fraction du côté court. 4 % : assez pour se
  // lire d'un coup d'œil, assez fin pour ne pas manger la photo.
  bandRatio: 0.04,
  // Rayon des coins de la plaque, même unité.
  radiusRatio: 0.04,
  // Voile sombre sur la plaque. Est passé de 20 % à 10 % le jour où le flou
  // a pris le relais de la protection : inutile de ternir une photo qu'on
  // veut vendre.
  veil: 0.1,
  // Écart-type du flou, en fraction du côté court — JAMAIS en pixels fixes :
  // un rayon fixe rendrait une vignette de 300 px illisible et laisserait un
  // aperçu de 1000 px net. "À peine flou" : la photo garde son piqué
  // apparent, le détail exploitable part.
  blurRatio: 0.003,

  // --- Le nom ------------------------------------------------------------
  // 0.82 : arbitré en dernier. Le flou étant au minimum, c'est le nom qui
  // porte la protection. En dessous il s'efface sur un ciel clair ; au-dessus
  // on regarde le filigrane et plus la sortie.
  opacity: 0.82,
  ink: "#ffffff",
  // Corps FIXE (fraction du côté court) : la maille reste la même sur toutes
  // les photos et pour tous les opérateurs. Cf. layoutRun.
  fontRatio: 0.0596,
  tracking: 1.02,
  runMax: 0.74,
  maxChars: 30,
  // Écart entre deux rangées, en corps. 1.80 : arbitré ("H5") entre une
  // trame qu'on traverse à l'œil et une trame qui étouffe l'image.
  rowFactor: 1.8,
  // Espace horizontal entre deux occurrences, en fraction de la longueur du
  // nom. Une rangée sur deux est décalée d'une demi-période : l'alignement
  // en colonnes trahit un filigrane bien plus que sa densité.
  gapRatio: 0.22,

  // --- Les visages -------------------------------------------------------
  // Le client doit se reconnaître dans le tas (brief §3) : l'alpha du calque
  // est retiré en douceur autour des visages détectés. Le flou, lui, n'est
  // pas atténué — à ce rayon un visage reste parfaitement identifiable.
  faceAttenuation: 0.72,
  faceRadiusScale: 1.3,
  faceFeather: 0.52,

  // --- Sortie ------------------------------------------------------------
  // La vraie garantie n'est pas le filigrane, c'est cette valeur : à 1000 px
  // de large, ce qu'on peut tirer d'un aperçu ne dépasse pas une story. Ne
  // pas la remonter.
  previewMaxWidth: 1000,
  jpegQuality: 72,
} as const;

/**
 * Le calque posé sur la plaque : le voile sombre, puis le nom en rangées,
 * puis l'atténuation autour des visages. Rendu à la taille de la plaque, pas
 * de l'image : le clip aux coins arrondis est fait par sharp au moment du
 * compositing, avec le même masque que le flou.
 */
function buildPlateLayer(plateW: number, plateH: number, basis: number, operatorName: string, faces: FaceZone[], offsetX: number, offsetY: number): Buffer {
  ensureWatermarkFont();
  const canvas = createCanvas(plateW, plateH);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = `rgba(13, 12, 18, ${PARAMS.veil})`;
  ctx.fillRect(0, 0, plateW, plateH);

  const word = layoutRun(ctx, operatorName, basis, PARAMS);
  const period = word.run * (1 + PARAMS.gapRatio);
  const rowHeight = word.fontSize * PARAMS.rowFactor;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = PARAMS.ink;
  ctx.globalAlpha = PARAMS.opacity;
  ctx.font = `${WORD_WEIGHT} ${word.fontSize}px ${FONT_FAMILY}`;
  ctx.letterSpacing = `${word.letterSpacingPx}px`;

  const rowCount = Math.ceil(plateH / rowHeight) + 1;
  const colCount = Math.ceil(plateW / period) + 2;

  for (let row = 0; row < rowCount; row++) {
    // Une rangée sur deux décalée d'une demi-période — jamais de colonnes.
    const shift = row % 2 === 0 ? 0 : -period / 2;
    const y = (row + 0.5) * rowHeight;
    for (let col = -1; col < colCount; col++) {
      ctx.fillText(word.text, col * period + shift, y);
    }
  }

  // Atténuation autour des visages : on retire de l'alpha déjà posé plutôt
  // que de moduler chaque occurrence. Une rangée traverse toute la photo ;
  // moduler l'occurrence entière ferait clignoter des lignes complètes.
  if (faces.length > 0) {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    for (const face of faces) {
      const cx = face.cx - offsetX;
      const cy = face.cy - offsetY;
      const gradient = ctx.createRadialGradient(cx, cy, face.radius * PARAMS.faceFeather, cx, cy, face.radius);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${PARAMS.faceAttenuation})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, face.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  return canvas.toBuffer("image/png");
}

/** Masque plein aux coins arrondis, à la taille de la plaque (blend dest-in). */
function roundedMask(width: number, height: number, radius: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
}

/**
 * Aperçu de galerie de groupe : la seule protection des photos avant
 * paiement. Le client doit se reconnaître dans le tas (brief §3), donc la
 * photo reste lisible — d'où un flou volontairement minime, compensé par un
 * nom bien présent. Voir PARAMS pour l'arbitrage complet.
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

  // La maille est dimensionnée sur le côté court, pas sur la largeur : la
  // grille de la galerie affiche chaque vignette dans une case CARRÉE
  // (object-fit: cover), le navigateur met donc chaque photo à l'échelle de
  // son côté le plus court. Baser la maille sur la largeur ferait paraître
  // le filigrane bien plus "zoomé" sur les paysages que sur les portraits.
  const basis = Math.min(width, height);

  const margin = Math.round(PARAMS.bandRatio * basis);
  const plateW = width - 2 * margin;
  const plateH = height - 2 * margin;

  // Photo minuscule : la plaque n'a plus de sens, on rend la photo telle
  // quelle plutôt que de produire un aperçu cassé.
  if (plateW < 8 || plateH < 8) {
    return sharp(rgb, { raw: { width, height, channels } })
      .jpeg({ quality: PARAMS.jpegQuality, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }

  const faces = await detectFaceZones(rgb, width, height, channels, PARAMS.faceRadiusScale).catch((error: unknown) => {
    console.error("[group-watermark] face detection failed, continuing without attenuation", error);
    return [] as FaceZone[];
  });

  const radius = PARAMS.radiusRatio * basis;
  const mask = roundedMask(plateW, plateH, radius);
  const sigma = Math.max(0.3, PARAMS.blurRatio * basis);

  // La plaque : la portion centrale de la photo, floutée, puis découpée aux
  // coins arrondis. Le flou est appliqué AVANT le texte pour que le nom reste
  // parfaitement net sur un fond adouci.
  const blurredPlate = await sharp(rgb, { raw: { width, height, channels } })
    .extract({ left: margin, top: margin, width: plateW, height: plateH })
    .blur(sigma)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const layer = await sharp(buildPlateLayer(plateW, plateH, basis, operatorName, faces, margin, margin))
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp(rgb, { raw: { width, height, channels } })
    .composite([
      { input: blurredPlate, top: margin, left: margin },
      { input: layer, top: margin, left: margin },
    ])
    .jpeg({ quality: PARAMS.jpegQuality, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}
