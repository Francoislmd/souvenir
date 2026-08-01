// Table de correspondance activité → emoji + teinte de tuile, pour le
// tableau des sorties. Matché sur le label stocké dans Sortie.activity
// (texte libre, pas un id contraint) — tout label non reconnu (activité
// personnalisée) retombe sur le couple par défaut.
export interface ActivityVisual {
  emoji: string;
  tint: string;
}

const DEFAULT_VISUAL: ActivityVisual = { emoji: "⚓", tint: "#F1EFEB" };

const VISUALS_BY_LABEL: Record<string, ActivityVisual> = {
  canyoning: { emoji: "🧗", tint: "#E9F1FB" },
  tyrolienne: { emoji: "🚡", tint: "#FCEFE0" },
  quad: { emoji: "🏍️", tint: "#F1EFEB" },
  parapente: { emoji: "🪁", tint: "#E7F0FB" },
  "hélicoptère": { emoji: "🚁", tint: "#EAEFF7" },
  rafting: { emoji: "🌊", tint: "#E4F4EC" },
  tubing: { emoji: "🛟", tint: "#FCEFE0" },
  "jet-ski": { emoji: "🚤", tint: "#E7F0FB" },
  kayak: { emoji: "🚣", tint: "#E4F4EC" },
  "parachute ascensionnel": { emoji: "🪂", tint: "#FCF0DE" },
  snuba: { emoji: "🤿", tint: "#E4F4EC" },
  paddle: { emoji: "🛶", tint: "#E4F4EC" },
  surf: { emoji: "🏄", tint: "#E7F0FB" },
  "observation des baleines": { emoji: "🐋", tint: "#EAEFF7" },
  autre: DEFAULT_VISUAL,
};

function normalize(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const VISUALS_BY_NORMALIZED_LABEL = Object.fromEntries(
  Object.entries(VISUALS_BY_LABEL).map(([label, visual]) => [normalize(label), visual]),
);

export function getActivityVisual(activityLabel: string): ActivityVisual {
  return VISUALS_BY_NORMALIZED_LABEL[normalize(activityLabel)] ?? DEFAULT_VISUAL;
}
