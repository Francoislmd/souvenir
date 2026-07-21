// Glyphs portés du prototype Linktrip (ACTS/GLYPH) — icônes génériques, pas de
// dépendance de marque, réutilisables telles quelles.
export interface ActivityDef {
  id: string;
  label: string;
  glyph: string; // contenu <path>/<circle> SVG, viewBox 0 0 24 24
}

export const ACTIVITIES: ActivityDef[] = [
  { id: "rafting", label: "Rafting", glyph: '<path d="M4 15h16l-2 4H6z"/><path d="M3 20c3 1 6 1 9 0s6-1 9 0"/>' },
  { id: "canyoning", label: "Canyoning", glyph: '<path d="M12 3v7"/><path d="M8 20a4 4 0 0 0 8 0c0-3-4-7-4-7s-4 4-4 7z"/>' },
  { id: "parapente", label: "Parapente", glyph: '<path d="M3 9c6-4 12-4 18 0"/><path d="M7 9l5 6 5-6"/><circle cx="12" cy="18" r="1.4"/>' },
  { id: "surf", label: "Surf", glyph: '<path d="M4 20C12 21 12 6 20 4"/><path d="M14 8l-8 8"/>' },
  { id: "plongee", label: "Plongée", glyph: '<rect x="5" y="9" width="14" height="6" rx="3"/><path d="M12 15v3"/>' },
  { id: "kayak", label: "Kayak", glyph: '<path d="M3 6l18 12"/><path d="M6 11c0 5 12 5 12 0"/>' },
  { id: "rando", label: "Randonnée", glyph: '<path d="M5 20l6-14 4 9 3-4 2 9z"/>' },
  { id: "viaferrata", label: "Via Ferrata", glyph: '<path d="M6 21V4l9 4-9 4"/>' },
  { id: "quad", label: "Quad", glyph: '<circle cx="7" cy="16" r="2.4"/><circle cx="17" cy="16" r="2.4"/><path d="M5 13h8l3-4h3"/>' },
  { id: "ski", label: "Ski", glyph: '<path d="M4 18l16-6M6 20l14-6"/><circle cx="17" cy="6" r="1.8"/>' },
  { id: "autre", label: "Autre", glyph: '<circle cx="12" cy="9" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/>' },
];
