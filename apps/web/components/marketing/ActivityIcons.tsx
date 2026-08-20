import type { SVGProps } from "react";

/* Pictogrammes d'activités — grille 24×24, stroke 1.5, aucun fill, `currentColor`.
   Dessinés sur une grille commune : l'épaisseur de trait constante est ce qui fait
   tenir l'ensemble comme un jeu de "logos". Si une activité est ajoutée, la
   redessiner sur la même grille — ne jamais mixer deux épaisseurs. */

export type ActivityIconProps = SVGProps<SVGSVGElement>;

const BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

/* Vague partagée par toutes les activités nautiques : ce motif récurrent est ce
   qui donne la cohérence de famille au jeu d'icônes. */
const WAVE = "M2.5 20.4c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0";

export function IconRafting(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M2.4 12.6h19.2l-2.3 4.6H4.7L2.4 12.6Z" />
      <path d="M8.6 12.6 15 4.4" />
      <path d="m13.6 3.1 2.9 2.2-1.7 2.3-2.9-2.2 1.7-2.3Z" />
      <path d={WAVE} />
    </svg>
  );
}

export function IconCanyoning(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 3v10.5" />
      <path d="M20 3v10.5" />
      <path d="M12 3.5v7" />
      <path d="M12 10.5c0 2.2 1.4 2.6 1.4 4.4" />
      <path d="M10.4 3.5a1.6 1.6 0 1 1 3.2 0" />
      <path d="M4 13.5h3M17 13.5h3" />
      <path d={WAVE} />
    </svg>
  );
}

export function IconKayak(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3.4 15.2c3-3.6 14.2-3.6 17.2 0-3 3.6-14.2 3.6-17.2 0Z" />
      <path d="M4.6 8.4 19.4 22" />
      <path d="m3.4 7.2 2.4 2.4M20.6 20.8l-2.4-2.4" />
    </svg>
  );
}

export function IconJetSki(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3.5 14.6h11.6c2 0 3.4-1 4.4-2.6" />
      <path d="M3.5 14.6c.6 1.6 1.8 2.4 3.6 2.4h8.3c2.6 0 4.4-1.4 5.1-3.4" />
      <path d="M9.4 11.2 12 7.4h3.4" />
      <path d="m15.4 6.2 2.4 1.2" />
      <path d={WAVE} />
    </svg>
  );
}

export function IconPaddle(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3.6 17.6c3.4-2.4 13.4-2.4 16.8 0-3.4 2.4-13.4 2.4-16.8 0Z" />
      <path d="M14.6 15.6V3.4" />
      <path d="M12.6 3.4h4" />
      <path d="M9.4 13.8a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" />
    </svg>
  );
}

export function IconSurf(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M12 2.6c4.6 3.4 6.6 8.6 4.4 13-1.4 2.8-3.2 4.4-4.4 5.4-1.2-1-3-2.6-4.4-5.4-2.2-4.4-.2-9.6 4.4-13Z" />
      <path d="M12 6.6v11" />
    </svg>
  );
}

export function IconZipline(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3 5.2 21 10" />
      <path d="M9.6 6.9v2.2" />
      <path d="M8.2 6.5h2.8" />
      <circle cx="9.6" cy="10.8" r="1.7" />
      <path d="M9.6 12.5v3.4" />
      <path d="m9.6 15.9-2 3.6M9.6 15.9l2 3.6" />
      <path d="M7.4 13.4h4.4" />
    </svg>
  );
}

export function IconAtv(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="5.4" cy="16.6" r="3.4" />
      <circle cx="18.6" cy="16.6" r="3.4" />
      <path d="M8.6 15.4h6.8" />
      <path d="M6.6 13.4 9 9.6h5.8l2.2 3.8" />
      <path d="M9.6 9.6V7.4h4" />
      <path d="M12.2 7.4h3.6" />
    </svg>
  );
}

export function IconParapente(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3.2 10.4a8.8 8.8 0 0 1 17.6 0" />
      <path d="M3.2 10.4c2.9 0 4.4 1.6 4.4 1.6M20.8 10.4c-2.9 0-4.4 1.6-4.4 1.6M12 10.4v1.6" />
      <path d="m4.6 11.2 6.6 4.6M19.4 11.2l-6.6 4.6" />
      <circle cx="12" cy="17" r="1.4" />
      <path d="M2.5 21c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" />
    </svg>
  );
}

export function IconHelicoptere(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3.4 5h17.2" />
      <path d="M12 5v2.6" />
      <path d="M6.6 13.8c0-2.2 2-4 4.6-4h2c2.6 0 4.6 1.8 4.6 4v1.6H6.6v-1.6Z" />
      <path d="M17.8 12.4h3.4l-1.4 3" />
      <path d="M20.4 15.4v3.2" />
      <path d="M8 15.4v3.2M15 15.4v3.2" />
      <path d="M6.4 18.6h10.4" />
    </svg>
  );
}

export function IconPlongee(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M8.6 8.2a3.2 3.2 0 0 1 6.4 0v1.4H8.6V8.2Z" />
      <path d="M8.6 9.6c-1.4.8-2.2 2.2-2.2 3.8v5.8h11.2v-5.8c0-1.6-.8-3-2.2-3.8" />
      <path d="M11.8 4.6V3M15.6 5.4l1-1.2M8 5.4 7 4.2" />
      <path d="M9.8 13.4h4.4" />
    </svg>
  );
}

export function IconParcAventure(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4.4 4.6v15" />
      <path d="M19.6 4.6v15" />
      <path d="M4.4 8.6c3.6 2.4 7.6 2.4 11.2 0" />
      <path d="M8.8 12.6c3.6 2.4 7.2 2.4 10.8 0" />
      <path d="M2.6 19.6h18.8" />
      <path d="M13.2 8.6v1.6M9.6 12.6v1.6" />
    </svg>
  );
}

export function IconSkiNautique(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M2.8 15.6c2.6 1.8 8.6 1.6 11.4-.6" />
      <path d="M4.4 18c2.6 1.6 8.2 1.4 10.8-.8" />
      <path d="M14.2 15c2.4-1.8 4-4 4.8-6.6" />
      <path d="M19 8.4h2.4" />
      <path d="M20.2 7.2v2.4" />
      <path d="M2.5 21c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" />
    </svg>
  );
}

export function IconBouee(props: ActivityIconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M12 5.6c4 0 7.2 2.6 7.2 5.8S16 17.2 12 17.2 4.8 14.6 4.8 11.4 8 5.6 12 5.6Z" />
      <path d="M12 9.2c1.7 0 3 1 3 2.2s-1.3 2.2-3 2.2-3-1-3-2.2 1.3-2.2 3-2.2Z" />
      <path d={WAVE} />
    </svg>
  );
}

export const ACTIVITY_ICONS = {
  rafting: IconRafting,
  canyoning: IconCanyoning,
  kayak: IconKayak,
  "jet-ski": IconJetSki,
  paddle: IconPaddle,
  surf: IconSurf,
  tyrolienne: IconZipline,
  quad: IconAtv,
  parapente: IconParapente,
  helicoptere: IconHelicoptere,
  plongee: IconPlongee,
  "parc-aventure": IconParcAventure,
  "ski-nautique": IconSkiNautique,
  bouee: IconBouee,
} as const;

export type ActivitySlug = keyof typeof ACTIVITY_ICONS;
