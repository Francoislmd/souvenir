import type { CSSProperties } from "react";

const INK = "#161320";

/**
 * La couleur du prestataire pour un bouton à texte blanc, sauf si elle est
 * trop claire pour être lue (un jaune, un vert pâle) : le bouton passe alors
 * à l'encre. Seuil : contraste du blanc d'au moins 3:1 (texte gras de 16 px).
 */
export function buttonColor(hex: string, fallback: string = INK): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1]!, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return 1.05 / (luminance + 0.05) >= 3 ? `#${m[1]}` : fallback;
}

/** Les variables de couleur du cadre de page côté client : --op et --op-btn. */
export function operatorVars(brandColor: string): CSSProperties {
  return { "--op": brandColor, "--op-btn": buttonColor(brandColor) } as CSSProperties;
}
