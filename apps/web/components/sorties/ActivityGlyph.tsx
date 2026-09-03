import type { SVGProps } from "react";

/* Glyphes d'activité — masses pleines sur une grille 24, pas de dessin au
   trait : à 21 px un aplat garde sa silhouette là où un filet de 1,6 px se
   brouille. Une activité inconnue retombe sur la marque générique. */

const GLYPHS: Record<string, React.ReactNode> = {
  surf: (
    <>
      <path d="M12 1.9c4 3.5 5.9 8.9 3.9 13.2-1.3 2.7-3 4.3-3.9 5.2-.9-.9-2.6-2.5-3.9-5.2C6.1 10.8 8 5.4 12 1.9Z" />
      <path d="M11.1 20.4h1.8v2.4a.9.9 0 0 1-1.8 0v-2.4Z" />
    </>
  ),
  paddle: (
    <>
      <ellipse cx="11.4" cy="16.8" rx="8.6" ry="3" transform="rotate(-6 11.4 16.8)" />
      <rect x="14.6" y="3.6" width="1.8" height="11" rx=".9" transform="rotate(13 15.5 9.1)" />
      <rect x="12.4" y="2.6" width="6.6" height="1.9" rx=".95" transform="rotate(13 15.7 3.5)" />
    </>
  ),
  rafting: (
    <>
      <path d="M2.6 12.9h18.8c.9 0 1.5.9 1.1 1.7l-1.4 2.9c-.4.8-1.3 1.4-2.2 1.4H6.1c-.9 0-1.8-.6-2.2-1.4l-1.4-2.9c-.4-.8.2-1.7 1.1-1.7Z" />
      <rect x="3.9" y="5.4" width="1.8" height="7.4" rx=".9" transform="rotate(-30 4.8 9.1)" />
      <rect x="18.3" y="5.4" width="1.8" height="7.4" rx=".9" transform="rotate(30 19.2 9.1)" />
    </>
  ),
  canyoning: (
    <>
      <path d="M5 2.1a1.1 1.1 0 0 1 1.4.7l3.3 8.9-2.1.8L4.3 3.5A1.1 1.1 0 0 1 5 2.1Z" />
      <circle cx="11.6" cy="14.2" r="2.6" />
      <rect x="10.7" y="16.3" width="1.8" height="3.2" rx=".9" />
      <path
        d="M2.5 21.3c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0 2.8-1.1 4.2 0 2.8 1.1 4.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </>
  ),
  tyrolienne: (
    <>
      <path d="M2.5 4.4 21.3 8.6a1.15 1.15 0 0 1-.5 2.25L2 6.65A1.15 1.15 0 0 1 2.5 4.4Z" />
      <rect x="7.7" y="8.3" width="5.2" height="3.5" rx="1.5" />
      <rect x="9.5" y="11.6" width="1.7" height="2.4" rx=".85" />
      <circle cx="10.35" cy="16.3" r="2.5" />
      <rect x="9.5" y="18.3" width="1.7" height="3.4" rx=".85" />
    </>
  ),
  parapente: (
    <>
      <path d="M12 3.4c-5.1 0-9.4 3.7-10.2 8.5-.1.9.9 1.5 1.6 1 1.3-.9 2.9-1.4 4.5-1.4h8.2c1.6 0 3.2.5 4.5 1.4.7.5 1.7-.1 1.6-1C21.4 7.1 17.1 3.4 12 3.4Z" />
      <circle cx="12" cy="18.6" r="2.4" />
      <path d="m4.9 12.4 6.2 4-1 1.6-6.2-4 1-1.6Zm14.2 0 1 1.6-6.2 4-1-1.6 6.2-4Z" />
    </>
  ),
  defaut: (
    <>
      <path d="M12 2.6 21 12h-4.6l-4.4-5.2L7.6 12H3l9-9.4Z" />
      <path d="M2.5 18.6c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0 2.8-1.1 4.2 0 2.8 1.1 4.2 0v2.6c-1.4 1.1-2.8 1.1-4.2 0s-2.8-1.1-4.2 0-2.8 1.1-4.2 0-2.8-1.1-4.2 0v-2.6Z" />
    </>
  ),
};

/* Familles d'activités qui partagent un glyphe : kayak et tubing descendent
   la même rivière que le rafting, le jet-ski file sur la même eau que le
   paddle. Mieux vaut un glyphe juste partagé qu'un glyphe faux par activité. */
const ALIASES: Record<string, string> = {
  kayak: "rafting",
  tubing: "rafting",
  "ski nautique": "paddle",
  "jet-ski": "paddle",
  snuba: "surf",
  "parachute ascensionnel": "parapente",
  "parc aventure": "tyrolienne",
};

function normalize(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function ActivityGlyph({ activity, ...props }: { activity: string } & SVGProps<SVGSVGElement>) {
  const key = normalize(activity);
  const resolved = ALIASES[key] ?? key;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      {GLYPHS[resolved] ?? GLYPHS.defaut}
    </svg>
  );
}
