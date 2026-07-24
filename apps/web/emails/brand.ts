/**
 * Souvenir — constantes de marque pour les emails.
 *
 * Rappel des contraintes email : pas de dégradé CSS, pas de filter, pas de flex,
 * pas de feuille de style externe. Tout est en ligne, tout est en tableaux.
 * Le dégradé de la marque est donc remplacé par une couleur unie.
 */

export const brand = {
  // couleurs — mêmes valeurs que apps/web/styles/tokens.css
  ink: "#161320",
  ink2: "#413C4E",
  ink3: "#726C80",
  ink4: "#A6A0B2",
  line: "#ECE9EF",
  line2: "#F4F2F6",
  soft: "#FFF1EB",
  paper: "#F4F2F6",
  white: "#FFFFFF",
  orange: "#FF5A1F", // remplace le dégradé partout en email
  orangeInk: "#E8460C",
  aqua: "#0FBEB6",
  ok: "#16A34A",
  okSoft: "#EAF7EF",
  whatsapp: "#25D366",

  // typographie — polices système en repli, les webfonts ne sont pas fiables en email
  fontBody: "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontHead: "'Inter Tight', Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",

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
