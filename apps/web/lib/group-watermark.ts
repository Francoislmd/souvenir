import sharp from "sharp";

const NAME_TILE = 260;
const BADGE_TILE = 150;

// Symbole Linktrip (cadre + point), extrait de components/brand/Logo.tsx —
// à resynchroniser si le tracé du logo change là-bas.
const LOGO_FRAME = "M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42";

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
  const name = operatorName.toUpperCase().replace(/[<>&]/g, "");
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm-name" width="${NAME_TILE}" height="${NAME_TILE}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text x="0" y="${NAME_TILE / 2}" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700"
                letter-spacing="2" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.4)" stroke-width="0.8">${name}</text>
        </pattern>
        <pattern id="wm-badge" width="${BADGE_TILE}" height="${BADGE_TILE}" patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-30) translate(${BADGE_TILE / 2} 0)">
          <svg x="${(BADGE_TILE - 26) / 2}" y="10" width="26" height="26" viewBox="0 0 100 100">
            <path d="${LOGO_FRAME}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="9" stroke-linecap="round" />
            <circle cx="73" cy="27" r="12" fill="rgba(255,255,255,0.5)" />
          </svg>
          <text x="${BADGE_TILE / 2}" y="48" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10.5"
                font-weight="700" letter-spacing="1.5" fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.35)" stroke-width="0.5">APERÇU</text>
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
