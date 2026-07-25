import sharp from "sharp";

const TILE = 230;

/**
 * Motif de filigrane répété, en diagonale, sur toute l'image — pas un simple
 * logo dans un coin. C'est la seule protection des photos de groupe avant
 * paiement (brief §3 : jamais de flou, le client doit se reconnaître), donc
 * elle doit tenir même quand l'opérateur n'a pas de logo : contour sombre +
 * remplissage clair pour rester lisible sur n'importe quel fond (ciel, eau,
 * rocher…).
 */
function buildTiledWatermarkSvg(width: number, height: number, label: string): Buffer {
  const text = label.toUpperCase().replace(/[<>&]/g, "");
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm" width="${TILE}" height="${TILE}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text x="0" y="${TILE / 2}" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700"
                letter-spacing="2" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.4)" stroke-width="0.8">${text}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>
  `);
}

/**
 * Aperçu de galerie de groupe : redimensionné, filigrane tuilé appliqué sur
 * toute la surface, jamais flouté (le grain d'origine reste net — c'est le
 * filigrane, pas le flou, qui protège ici).
 */
export async function generateGroupPreview(original: Buffer, label: string): Promise<Buffer> {
  // Redimensionne et matérialise le buffer d'abord : composite() exige des
  // dimensions exactes, et .metadata() sur un pipeline avec resize() en
  // attente ne reflète pas fiablement la taille de sortie réelle.
  const { data: resized, info } = await sharp(original).rotate().resize({ width: 1280 }).toBuffer({ resolveWithObject: true });
  const svg = buildTiledWatermarkSvg(info.width, info.height, label);
  return sharp(resized).composite([{ input: svg, top: 0, left: 0 }]).jpeg({ quality: 78 }).toBuffer();
}
