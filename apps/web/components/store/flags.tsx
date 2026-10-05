/**
 * Petits drapeaux en SVG, dessinés ici plutôt qu'en emoji : Windows affiche
 * les emoji de drapeaux comme deux lettres (« FR »). Simplifiés au format
 * 20 × 14, sans armoiries.
 */
const W = 20;
const H = 14;

function Bands({ colors, vertical = true }: { colors: string[]; vertical?: boolean }) {
  const n = colors.length;
  return (
    <>
      {colors.map((c, i) =>
        vertical ? <rect key={i} x={(W / n) * i} y={0} width={W / n + 0.2} height={H} fill={c} /> : <rect key={i} x={0} y={(H / n) * i} width={W} height={H / n + 0.2} fill={c} />,
      )}
    </>
  );
}

const ART: Record<string, JSX.Element> = {
  FR: <Bands colors={["#0055A4", "#FFFFFF", "#EF4135"]} />,
  BE: <Bands colors={["#000000", "#FDDA24", "#EF3340"]} />,
  IT: <Bands colors={["#009246", "#FFFFFF", "#CE2B37"]} />,
  DE: <Bands colors={["#000000", "#DD0000", "#FFCE00"]} vertical={false} />,
  NL: <Bands colors={["#AE1C28", "#FFFFFF", "#21468B"]} vertical={false} />,
  LU: <Bands colors={["#EF3340", "#FFFFFF", "#00A3E0"]} vertical={false} />,
  AT: <Bands colors={["#EF3340", "#FFFFFF", "#EF3340"]} vertical={false} />,
  ES: (
    <>
      <rect width={W} height={H} fill="#AA151B" />
      <rect y={3.5} width={W} height={7} fill="#F1BF00" />
    </>
  ),
  PT: (
    <>
      <rect width={W} height={H} fill="#FF0000" />
      <rect width={8} height={H} fill="#006600" />
      <circle cx={8} cy={7} r={2.6} fill="#FFCC00" />
    </>
  ),
  CH: (
    <>
      <rect width={W} height={H} fill="#D52B1E" />
      <rect x={8.75} y={3} width={2.5} height={8} fill="#FFFFFF" />
      <rect x={6} y={5.75} width={8} height={2.5} fill="#FFFFFF" />
    </>
  ),
  GB: (
    <>
      <rect width={W} height={H} fill="#012169" />
      <path d="M0 0 20 14M20 0 0 14" stroke="#FFFFFF" strokeWidth={2.8} />
      <path d="M0 0 20 14M20 0 0 14" stroke="#C8102E" strokeWidth={1.1} />
      <path d="M10 0v14M0 7h20" stroke="#FFFFFF" strokeWidth={4.2} />
      <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth={2.4} />
    </>
  ),
  US: (
    <>
      <rect width={W} height={H} fill="#FFFFFF" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * (H / 13)} width={W} height={H / 13} fill="#B22234" />
      ))}
      <rect width={9} height={7.5} fill="#3C3B6E" />
    </>
  ),
  CA: (
    <>
      <rect width={W} height={H} fill="#FFFFFF" />
      <rect width={5} height={H} fill="#D80621" />
      <rect x={15} width={5} height={H} fill="#D80621" />
      <path d="M10 3.2 11 5.3l1.2-.5-.4 2.4 1.4-1.1.3.9 1.3-.2-.6 1.5.6.4-2.6 1.9.3 1H10.4V13h-.8v-1.6H7.5l.3-1-2.6-1.9.6-.4-.6-1.5 1.3.2.3-.9 1.4 1.1-.4-2.4 1.2.5z" fill="#D80621" />
    </>
  ),
};

export function Flag({ code }: { code: string }) {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ display: "block", flex: "none" }}>
      <clipPath id={`flag-${code}`}>
        <rect width={W} height={H} rx={2.5} />
      </clipPath>
      <g clipPath={`url(#flag-${code})`}>{ART[code] ?? <rect width={W} height={H} fill="#ECE9EF" />}</g>
      <rect width={W} height={H} rx={2.5} fill="none" stroke="rgba(22,19,32,0.14)" strokeWidth={0.8} />
    </svg>
  );
}

export interface Country {
  code: string;
  name: string;
  dial: string;
  /** Le 0 de la numérotation nationale disparaît avec l'indicatif (pas en Italie). */
  dropTrunkZero: boolean;
}

/** Les pays des clients des sorties outdoor en France, la France d'abord. */
export const COUNTRIES: Country[] = [
  { code: "FR", name: "France", dial: "33", dropTrunkZero: true },
  { code: "BE", name: "Belgique", dial: "32", dropTrunkZero: true },
  { code: "CH", name: "Suisse", dial: "41", dropTrunkZero: true },
  { code: "LU", name: "Luxembourg", dial: "352", dropTrunkZero: false },
  { code: "DE", name: "Allemagne", dial: "49", dropTrunkZero: true },
  { code: "ES", name: "Espagne", dial: "34", dropTrunkZero: false },
  { code: "IT", name: "Italie", dial: "39", dropTrunkZero: false },
  { code: "NL", name: "Pays-Bas", dial: "31", dropTrunkZero: true },
  { code: "GB", name: "Royaume-Uni", dial: "44", dropTrunkZero: true },
  { code: "PT", name: "Portugal", dial: "351", dropTrunkZero: false },
  { code: "AT", name: "Autriche", dial: "43", dropTrunkZero: true },
  { code: "US", name: "États-Unis", dial: "1", dropTrunkZero: false },
  { code: "CA", name: "Canada", dial: "1", dropTrunkZero: false },
];
