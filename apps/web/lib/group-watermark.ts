import sharp from "sharp";
import opentype from "opentype.js";
import { WATERMARK_FONT_WOFF_BASE64 } from "./fonts/watermark-font";

const NAME_TILE = 260;
const BADGE_TILE = 150;

// Symbole Linktrip (cadre + point), extrait de components/brand/Logo.tsx —
// à resynchroniser si le tracé du logo change là-bas.
const LOGO_FRAME = "M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42";

// Le texte du filigrane est converti en tracés vectoriels (via opentype.js)
// plutôt que rendu en <text> SVG : le runtime Vercel qui exécute sharp
// n'a aucune police système installée, donc <text font-family="Arial..."/>
// y produit des tofu (glyphes vides) en production alors que ça a l'air
// correct en local (où une police système existe toujours). Voir
// fonts/watermark-font.ts pour le détail du choix de police.
let cachedFont: opentype.Font | null = null;
function getWatermarkFont(): opentype.Font {
  if (!cachedFont) {
    const buf = Buffer.from(WATERMARK_FONT_WOFF_BASE64, "base64");
    cachedFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return cachedFont;
}

function textPathData(font: opentype.Font, text: string, x: number, y: number, fontSize: number, letterSpacing: number): string {
  return font.getPath(text, x, y, fontSize, { letterSpacing }).toPathData(2);
}

/**
 * Motif de filigrane répété, en diagonale, sur toute l'image — pas un simple
 * logo dans un coin. C'est la seule protection des photos de groupe avant
 * paiement (brief §3 : jamais de flou, le client doit se reconnaître), donc
 * elle doit tenir même quand l'opérateur n'a pas de logo : contour sombre +
 * remplissage clair pour rester lisible sur n'importe quel fond (ciel, eau,
 * rocher…). Deux calques tuilés superposés : le nom du professionnel en
 * grand, et un badge plus petit et plus dense (symbole Linktrip + "Aperçu")
 * qui rappelle que l'image n'est pas la version achetée.
 */
function buildTiledWatermarkSvg(width: number, height: number, operatorName: string): Buffer {
  const font = getWatermarkFont();
  const name = operatorName.toUpperCase().replace(/[<>&]/g, "");

  const nameFontSize = 21;
  const nameLetterSpacing = 2 / nameFontSize;
  const namePath = textPathData(font, name, 0, NAME_TILE / 2, nameFontSize, nameLetterSpacing);

  const badgeText = "APERÇU";
  const badgeFontSize = 10.5;
  const badgeLetterSpacing = 1.5 / badgeFontSize;
  const badgeTextWidth = font.getAdvanceWidth(badgeText, badgeFontSize, { letterSpacing: badgeLetterSpacing });
  const badgePath = textPathData(font, badgeText, BADGE_TILE / 2 - badgeTextWidth / 2, 48, badgeFontSize, badgeLetterSpacing);

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm-name" width="${NAME_TILE}" height="${NAME_TILE}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <path d="${namePath}" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.4)" stroke-width="0.8" />
        </pattern>
        <pattern id="wm-badge" width="${BADGE_TILE}" height="${BADGE_TILE}" patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-30) translate(${BADGE_TILE / 2} 0)">
          <svg x="${(BADGE_TILE - 26) / 2}" y="10" width="26" height="26" viewBox="0 0 100 100">
            <path d="${LOGO_FRAME}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="9" stroke-linecap="round" />
            <circle cx="73" cy="27" r="12" fill="rgba(255,255,255,0.5)" />
          </svg>
          <path d="${badgePath}" fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.35)" stroke-width="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm-name)" />
      <rect width="100%" height="100%" fill="url(#wm-badge)" />
    </svg>
  `);
}

/**
 * Aperçu de galerie de groupe : redimensionné, filigrane tuilé appliqué sur
 * toute la surface, jamais flouté (le grain d'origine reste net — c'est le
 * filigrane, pas le flou, qui protège ici).
 */
export async function generateGroupPreview(original: Buffer, operatorName: string): Promise<Buffer> {
  // Redimensionne et matérialise le buffer d'abord : composite() exige des
  // dimensions exactes, et .metadata() sur un pipeline avec resize() en
  // attente ne reflète pas fiablement la taille de sortie réelle.
  const { data: resized, info } = await sharp(original).rotate().resize({ width: 1280 }).toBuffer({ resolveWithObject: true });
  const svg = buildTiledWatermarkSvg(info.width, info.height, operatorName);
  return sharp(resized).composite([{ input: svg, top: 0, left: 0 }]).jpeg({ quality: 78 }).toBuffer();
}
