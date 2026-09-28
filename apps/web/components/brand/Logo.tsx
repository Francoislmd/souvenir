import { useId } from "react";

/**
 * Linktrip — logo officiel (refonte du 28/09/2026).
 * Géométrie de référence, ne pas modifier :
 *   cadre  : trait 8.5, coins 16, grille 100, extrémités reculées de 0.5
 *            pour garder l'écart d'origine avec le point
 *   point  : rayon 11, centré en (73, 27)
 *   mot    : Gabarito SemiBold 600 vectorisé, approche −0.035 em ;
 *            hampe du « l » = hauteur du cadre (16 → 84), ligne de base en 84
 *   signature : le point du « i » de « trip » reprend le dégradé du symbole,
 *            agrandi de 20 % ; le point du premier « i » reste à l'encre
 *   écart  : le mot commence à x = 104 dans la version horizontale
 */

const FRAME =
  "M57.5 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42.5";
const STROKE = 8.5;

/** « linktrip » sans les points des « i », ligne de base en y = 84, départ en x = 0. */
const WORD =
  "M17.68 84.5Q14.36 84.5 11.62 83.1Q8.88 81.7 7.23 78.77Q5.59 75.83 5.59 71.15V16H18.55V66.55Q18.55 70.03 19.94 71.09Q21.34 72.15 23.41 72.15V83.81Q22.3 84.15 20.73 84.33Q19.15 84.5 17.68 84.5Z M41.63 84H28.52V35.2H41.63Z M78.83 34.04Q83.87 34.04 86.93 35.75Q89.98 37.46 91.53 40.35Q93.08 43.24 93.6 46.9Q94.11 50.55 94.11 54.45V84H81.03V54.34Q81.03 49.83 79.26 48.34Q77.48 46.85 74.75 46.85Q72.28 46.85 69.69 47.82Q67.1 48.79 64.87 50.51Q62.63 52.23 61.04 54.43L59.33 47.62H62.6V84H49.52V35.2H59.29L61.96 44.51L57.78 44.35Q60.43 41.35 63.74 39.03Q67.05 36.72 70.88 35.38Q74.71 34.04 78.83 34.04Z M110.43 59.44V57.73L130.84 35.2H145.68L123.02 60.57L122.47 55.24L146.07 84H130.72Z M101.25 16H114.2V84H101.25Z M167.75 84.86Q160.21 84.86 155.88 80.92Q151.54 76.99 151.54 68.3V35.79L151.43 35.2L154.05 23.71H164.62V66.21Q164.62 69.42 166.17 70.86Q167.71 72.29 170.17 72.29Q171.76 72.29 173.07 72.06Q174.39 71.82 175.35 71.52V83.75Q173.75 84.26 171.93 84.56Q170.12 84.86 167.75 84.86Z M143.98 47.25V35.2H175.35V47.25Z M191.9 35.2 195.21 48.61V84H182.13V35.2Z M192.56 55.37 190.09 54.28V44.27L191.03 43.14Q192.14 41.38 194.37 39.25Q196.59 37.13 199.56 35.59Q202.53 34.04 205.68 34.04Q207.26 34.04 208.57 34.26Q209.88 34.48 210.61 34.98V46.83H207.4Q200.88 46.83 197.42 48.9Q193.96 50.97 192.56 55.37Z M227.86 84H214.74V35.2H227.86Z M261.94 85.15Q255.47 85.15 250.67 82.14Q245.87 79.13 243.2 73.42Q240.53 67.71 240.53 59.66Q240.53 51.78 243.24 46.07Q245.95 40.36 250.76 37.2Q255.58 34.04 262.02 34.04Q268.73 34.04 273.77 37.3Q278.82 40.55 281.65 46.3Q284.49 52.05 284.49 59.66Q284.49 67.17 281.63 72.94Q278.78 78.71 273.7 81.93Q268.62 85.15 261.94 85.15Z M235.75 102.97V35.2H245.55L248.83 46.78H247.87V71.21H248.83V102.97Z M259.68 73.09Q264.72 73.09 267.95 69.35Q271.17 65.62 271.17 59.66Q271.17 53.64 267.95 49.85Q264.72 46.07 259.68 46.07Q254.7 46.07 251.44 49.82Q248.18 53.58 248.18 59.6Q248.18 65.62 251.44 69.35Q254.7 73.09 259.68 73.09Z";
/** point du « i » de « link » (encre) et du « i » de « trip » (dégradé) */
const DOT_LINK = { cx: 35.08, cy: 19.86, r: 7.9 };
const DOT_TRIP = { cx: 221.3, cy: 19.39, r: 9.49 };

export type LogoVariant = "lockup" | "stacked" | "symbol" | "wordmark";
export type LogoTone = "ink" | "white" | "mono" | "mono-white";

export interface LogoProps {
  /** lockup = horizontal (défaut) · stacked = vertical · symbol = cadre seul · wordmark = mot seul */
  variant?: LogoVariant;
  /**
   * ink = fond clair · white = fond sombre ·
   * mono = une seule couleur encre, sans dégradé ·
   * mono-white = tout en blanc (sur photo ou sur le dégradé de marque)
   */
  tone?: LogoTone;
  /** hauteur en px ; la largeur suit le ratio */
  height?: number;
  className?: string;
  /** libellé accessible ; null pour un logo purement décoratif */
  title?: string | null;
}

/** viewBox de chaque version : [x, y, largeur, hauteur] */
const VIEW: Record<LogoVariant, [number, number, number, number]> = {
  lockup: [10, 0, 381, 108],
  stacked: [0, 8, 184, 152],
  symbol: [0, 0, 100, 100],
  wordmark: [3, 8, 284, 97],
};

export function Logo({
  variant = "lockup",
  tone = "ink",
  height = 32,
  className,
  title = "Linktrip",
}: LogoProps) {
  const gid = useId();
  const [vx, vy, vw, vh] = VIEW[variant];
  const mono = tone === "mono" || tone === "mono-white";
  const ink = tone === "white" || tone === "mono-white" ? "#FFFFFF" : "#161320";
  const accent = mono ? ink : `url(#${gid})`;

  const symbol = (
    <>
      <path d={FRAME} fill="none" stroke={accent} strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx={73} cy={27} r={11} fill={accent} />
    </>
  );
  const word = (
    <>
      <path d={WORD} fill={ink} />
      <circle {...DOT_LINK} fill={ink} />
      <circle {...DOT_TRIP} fill={accent} />
    </>
  );

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      height={height}
      width={(height * vw) / vh}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {!mono && (
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FF3D6E" />
            <stop offset="0.52" stopColor="#FF5A1F" />
            <stop offset="1" stopColor="#FFB443" />
          </linearGradient>
        </defs>
      )}

      {variant === "symbol" && symbol}
      {variant === "wordmark" && word}
      {variant === "lockup" && (
        <>
          {symbol}
          <g transform="translate(104 0)">{word}</g>
        </>
      )}
      {variant === "stacked" && (
        <>
          <g transform="translate(44 0)">{symbol}</g>
          <g transform="translate(2.07 92.1) scale(0.62)">{word}</g>
        </>
      )}
    </svg>
  );
}

export default Logo;
