/**
 * Souvenir — constantes de marque pour les emails.
 *
 * Rappel des contraintes email : pas de dégradé CSS, pas de filter, pas de flex,
 * pas de feuille de style externe. Tout est en ligne, tout est en tableaux.
 * Le dégradé de la marque est donc remplacé par une couleur unie.
 */

export const brand = {
  // couleurs — mêmes valeurs que apps/web/styles/tokens.css
  ink: "#191D24",
  ink2: "#3F4652",
  ink3: "#6B7380",
  ink4: "#A3AAB5",
  line: "#E3E7EE",
  line2: "#F1F3F6",
  soft: "#EEF4FF",
  paper: "#F1F3F6",
  white: "#FFFFFF",
  orange: "#1A55D6", // bleu Océan (17/10/2026), nom de clé historique ; remplace le dégradé en email
  orangeInk: "#1544AC",
  aqua: "#2AA6A4",
  ok: "#1E7B3A",
  okSoft: "#E6F4EA",
  whatsapp: "#25D366",

  // typographie — polices système en repli, les webfonts ne sont pas fiables en email
  fontBody: "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontHead: "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",

  // gabarit
  width: 560, // largeur maximale du bloc de contenu
  radius: 18,
  radiusSm: 12,
} as const;

/** Styles réutilisables, en objets pour React Email. */
export const s = {
  body: { backgroundColor: brand.paper, margin: 0, padding: "22px 12px" },
  card: {
    backgroundColor: brand.white,
    borderRadius: brand.radius,
    maxWidth: brand.width,
    margin: "0 auto",
    overflow: "hidden" as const,
  },
  h1: {
    fontFamily: brand.fontHead,
    fontWeight: 700,
    fontSize: "21px",
    lineHeight: "1.25",
    letterSpacing: "-0.5px",
    color: brand.ink,
    margin: 0,
  },
  lead: {
    fontFamily: brand.fontBody,
    fontSize: "15px",
    lineHeight: "1.55",
    color: brand.ink3,
    margin: "9px 0 0",
  },
  small: {
    fontFamily: brand.fontBody,
    fontSize: "12px",
    lineHeight: "1.7",
    color: brand.ink4,
    margin: 0,
  },
  /** Bouton « bulletproof » : c'est le <td> qui porte le fond, pas le <a>. */
  buttonCell: (bg: string) => ({ backgroundColor: bg, borderRadius: "999px" }),
  buttonLink: {
    display: "block",
    padding: "16px 24px",
    fontFamily: brand.fontHead,
    fontWeight: 700,
    fontSize: "16px",
    color: brand.white,
    textDecoration: "none",
    letterSpacing: "-0.2px",
  },
} as const;
