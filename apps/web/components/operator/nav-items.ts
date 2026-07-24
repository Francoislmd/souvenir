export interface NavItem {
  href: string;
  label: string;
  key: "sorties" | "revenus" | "reglages";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/sorties", label: "Sorties", key: "sorties" },
  { href: "/revenus", label: "Revenus", key: "revenus" },
  { href: "/reglages", label: "Réglages", key: "reglages" },
];
