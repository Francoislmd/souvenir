import type { CSSProperties } from "react";

const INK = "#2A1022";

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

/**
 * Les variables de couleur du cadre de page côté client : --op (accents) et
 * --op-btn (boutons pleins).
 *
 * Depuis le 28/10/2026, les pages client suivent le design system Corail,
 * quelle que soit la couleur choisie par le prestataire : boutons aubergine,
 * accents corail. La couleur du prestataire reste enregistrée (Réglages) ;
 * pour la rebrancher, renvoyer brandColor et buttonColor(brandColor) ici.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- gardé pour rebrancher la couleur du pro
export function operatorVars(_brandColor: string): CSSProperties {
  return { "--op": "#E8553B", "--op-btn": "#2A1022" } as CSSProperties;
}
