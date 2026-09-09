import sharp from "sharp";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { layoutRun, ensureWatermarkFont, FONT_FAMILY, WORD_WEIGHT } from "./watermark-typography";
import { detectFaceZones, type FaceZone } from "./watermark-faces";

/**
 * Réglage de direction artistique — VERROUILLÉ. Ne pas arrondir, ne pas
 * "optimiser" : chaque valeur a été arbitrée sur des rendus comparés côte à
 * côte, colonne par colonne, un seul paramètre changeant à la fois.
 *
 * La composition, en quatre couches :
 *   1. la photo, à peine floutée, jusqu'au bord ;
 *   2. un voile sombre uniforme ;
 *   3. le nom du professionnel, précédé d'un ©, écrit EN DIAGONALE et répété
 *      en rangées décalées d'une demi-période ;
 *   4. un cadenas au centre, dans une pastille encre.
 *
 * Version du 09/09/2026 (option "C") : la plaque arrondie insérée d'une marge
 * a été retirée au profit d'un traitement plein cadre. Ce qui fait l'objet
 * n'est plus le contraste entre une plaque et une bande nette, c'est la trame
 * diagonale elle-même — la convention visuelle de l'aperçu payant, comprise
 * sans explication. Le flou et le voile de l'ancienne plaque sont conservés
 * tels quels, étendus à toute l'image : ce sont eux qui protègent, le nom ne
 * fait que rendre la protection visible.
 *
 * Stack imposée : sharp (lecture, rotation EXIF, redimensionnement, flou,
 * encodage mozjpeg) + @napi-rs/canvas (dessin + métriques de texte — sharp ne
 * mesure pas le texte, et librsvg gère mal l'interlettrage).
 */
const PARAMS = {
  // --- Le traitement de fond ---------------------------------------------
  // Voile sombre uniforme. 12 % : assez pour que le nom blanc tienne sur un
  // ciel surexposé, assez peu pour ne pas ternir une photo qu'on veut vendre.
  veil: 0.12,
  // Écart-type du flou, en fraction du côté court — JAMAIS en pixels fixes :
  // un rayon fixe rendrait une vignette de 300 px illisible et laisserait un
  // aperçu de 1000 px net. "À peine flou" : la photo garde son piqué
  // apparent, le détail exploitable part.
  blurRatio: 0.004,

  // --- Le nom ------------------------------------------------------------
  // L'inclinaison. -20° : la diagonale de la référence. Assez marquée pour
  // qu'on la lise comme un filigrane et pas comme un défaut d'horizon, assez
  // douce pour que le nom reste confortable à lire.
  angleDeg: -20,
  // 0.55 : le flou étant au minimum, c'est le nom qui porte la protection. En
  // dessous il s'efface sur un ciel clair ; au-dessus on regarde le filigrane
  // et plus la sortie.
  opacity: 0.55,
  ink: "#ffffff",
  // Le © : il ne protège rien juridiquement de plus, mais il dit "photo d'un
  // pro" là où le nom seul peut passer pour une signature décorative.
  prefix: "© ",
  // Corps FIXE (fraction du côté court) : la maille reste la même sur toutes
  // les photos et pour tous les opérateurs. Cf. layoutRun.
  fontRatio: 0.052,
  tracking: 1.02,
  runMax: 0.74,
  maxChars: 30,
  // Écart entre deux rangées, en corps.
  rowFactor: 1.8,
  // Espace horizontal entre deux occurrences, en fraction de la longueur du
  // nom. Une rangée sur deux est décalée d'une demi-période : l'alignement
  // en colonnes trahit un filigrane bien plus que sa densité.
  gapRatio: 0.22,
  // Plancher de période, en fraction du côté court. Sans lui, un nom très
  // court ("Ki") se répète dix fois par rangée et la photo disparaît sous la
  // trame : la maille garde un pas minimum quelle que soit la longueur du nom.
  minPeriodRatio: 0.44,
  // Ombre portée du texte, en fraction du corps. Le blanc pur sur une écume
  // blanche disparaît ; l'ombre le décolle sans l'alourdir.
  shadowBlurRatio: 0.18,
  shadowOffsetRatio: 0.03,

  // --- Le cadenas --------------------------------------------------------
  // Diamètre de la pastille, en fraction du côté court.
  lockRatio: 0.16,
  lockVeil: 0.55,

  // --- Les visages -------------------------------------------------------
  // Le client doit se reconnaître dans le tas (brief §3), donc l'alpha du
  // calque est retiré en douceur autour des visages détectés. Le flou, lui,
  // n'est pas atténué — à ce rayon un visage reste parfaitement identifiable.
  faceAttenuation: 0.6,
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
 * Le cadenas central. Même dessin que le badge incrusté dans l'aperçu email
 * (lib/photo-processing.ts), à la grille 112 près, remis à l'échelle du côté
 * court : les deux images se retrouvent côte à côte dans le parcours d'achat.
 */
function drawLock(ctx: SKRSContext2D, cx: number, cy: number, size: number): void {
  const scale = size / 112;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(20, 19, 32, ${PARAMS.lockVeil})`;
  ctx.fill();
  ctx.lineWidth = Math.max(1, size * 0.008);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.stroke();

  ctx.translate(cx, cy + 2 * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = PARAMS.ink;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const x = -17;
  const y = -4;
  const width = 34;
  const height = 24;
  const radius = 5;
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.lineTo(-10, -14);
  ctx.arc(0, -14, 10, Math.PI, 0);
  ctx.lineTo(10, -4);
  ctx.stroke();
  ctx.restore();
}

/**
 * Le calque posé sur la photo : le voile sombre, puis le nom en rangées
 * inclinées, puis l'atténuation autour des visages, puis le cadenas — dans cet
 * ordre. Le cadenas vient après l'atténuation pour rester entier même quand un
 * visage est détecté au centre de la photo.
 */
function buildLayer(width: number, height: number, basis: number, operatorName: string, faces: FaceZone[]): Buffer {
  ensureWatermarkFont();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = `rgba(13, 12, 18, ${PARAMS.veil})`;
  ctx.fillRect(0, 0, width, height);

  const word = layoutRun(ctx, `${PARAMS.prefix}${operatorName}`, basis, PARAMS);
  const period = Math.max(word.run * (1 + PARAMS.gapRatio), PARAMS.minPeriodRatio * basis);
  const rowHeight = word.fontSize * PARAMS.rowFactor;

  // La trame est dessinée dans un repère tourné, sur un carré du côté de la
  // diagonale de l'image : c'est la seule taille qui garantit qu'aucun coin ne
  // se retrouve à découvert, quelle que soit l'inclinaison.
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((PARAMS.angleDeg * Math.PI) / 180);
  const span = Math.ceil(Math.sqrt(width * width + height * height));

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = PARAMS.ink;
  ctx.globalAlpha = PARAMS.opacity;
  ctx.font = `${WORD_WEIGHT} ${word.fontSize}px ${FONT_FAMILY}`;
  ctx.letterSpacing = `${word.letterSpacingPx}px`;
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = word.fontSize * PARAMS.shadowBlurRatio;
  ctx.shadowOffsetY = word.fontSize * PARAMS.shadowOffsetRatio;

  const rowCount = Math.ceil(span / rowHeight) + 2;
  const colCount = Math.ceil(span / period) + 2;
  for (let row = -1; row < rowCount; row++) {
    // Une rangée sur deux décalée d'une demi-période — jamais de colonnes.
    const shift = row % 2 === 0 ? 0 : -period / 2;
    const y = -span / 2 + (row + 0.5) * rowHeight;
    for (let col = -1; col < colCount; col++) {
      ctx.fillText(word.text, -span / 2 + col * period + shift, y);
    }
  }
  ctx.restore();

  // Atténuation autour des visages : on retire de l'alpha déjà posé plutôt
  // que de moduler chaque occurrence. Une rangée traverse toute la photo ;
  // moduler l'occurrence entière ferait clignoter des lignes complètes.
  if (faces.length > 0) {
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalCompositeOperation = "destination-out";
    for (const face of faces) {
      const gradient = ctx.createRadialGradient(face.cx, face.cy, face.radius * PARAMS.faceFeather, face.cx, face.cy, face.radius);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${PARAMS.faceAttenuation})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(face.cx, face.cy, face.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  drawLock(ctx, width / 2, height / 2, PARAMS.lockRatio * basis);

  return canvas.toBuffer("image/png");
}

/**
 * Aperçu de galerie de groupe : la seule protection des photos avant
 * paiement. Le client doit se reconnaître dans le tas (brief §3), donc la
 * photo reste lisible — d'où un flou volontairement minime, compensé par une
 * trame de noms bien présente. Voir PARAMS pour l'arbitrage complet.
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

  // Photo minuscule : la trame n'a plus de sens, on rend la photo telle
  // quelle plutôt que de produire un aperçu cassé.
  if (basis < 64) {
    return sharp(rgb, { raw: { width, height, channels } })
      .jpeg({ quality: PARAMS.jpegQuality, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }

  // La détection tourne sur les pixels NETS : le flou est appliqué ensuite, et
  // le texte est dessiné sur le calque, donc au-dessus de tout — le nom reste
  // parfaitement net sur un fond adouci.
  const faces = await detectFaceZones(rgb, width, height, channels, PARAMS.faceRadiusScale).catch((error: unknown) => {
    console.error("[group-watermark] face detection failed, continuing without attenuation", error);
    return [] as FaceZone[];
  });

  const layer = buildLayer(width, height, basis, operatorName, faces);

  return sharp(rgb, { raw: { width, height, channels } })
    .blur(Math.max(0.3, PARAMS.blurRatio * basis))
    .composite([{ input: layer, top: 0, left: 0 }])
    .jpeg({ quality: PARAMS.jpegQuality, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}
