/* Icônes de l'espace pro : dessin maison, grille 24, trait 1.6, bouts
   arrondis, `currentColor`. Même famille que les icônes d'activité du site.
   Elles remplacent le 22/09/2026 les Material Symbols, trop reconnaissables
   comme icônes de série. L'entrée active épaissit le trait : avec l'aplat
   blanc de la ligne, c'est ce qui dit où l'on est, sans ajouter d'orange. */

type IconProps = { size?: number; active?: boolean; className?: string };

function Icon({ size = 18, active, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 1.9 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function SortiesIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="3" />
      <path d="M3.75 10h16.5M8 3.25v3.5M16 3.25v3.5" />
    </Icon>
  );
}
export function RevenusIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3.75 16.5 9 11.25l3.75 3.75 7.5-7.5" />
      <path d="M15 7.5h5.25v5.25" />
    </Icon>
  );
}
export function ReglagesIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 7.5h8.5M17.5 7.5H20M4 16.5h2.5M11.5 16.5H20" />
      <circle cx="15" cy="7.5" r="2.25" />
      <circle cx="9" cy="16.5" r="2.25" />
    </Icon>
  );
}
export function BoutiqueIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5.5 8.5h13l-.9 11.25H6.4L5.5 8.5Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </Icon>
  );
}
export function MailIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3.75" y="5.75" width="16.5" height="12.5" rx="2.5" />
      <path d="m4.5 7.25 7.5 5.5 7.5-5.5" />
    </Icon>
  );
}
export function LogoutIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M13.5 4.75H7.25a2.5 2.5 0 0 0-2.5 2.5v9.5a2.5 2.5 0 0 0 2.5 2.5h6.25" />
      <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </Icon>
  );
}
export function OutwardIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M8 16 16 8M9.5 8H16v6.5" />
    </Icon>
  );
}
