// Activités affichées en pastilles de texte — pas de pictogramme par
// activité (une marque de photo montre des photos, pas des icônes).
export interface ActivityDef {
  id: string;
  label: string;
}

export const ACTIVITIES: ActivityDef[] = [
  { id: "canyoning", label: "Canyoning" },
  { id: "tyrolienne", label: "Tyrolienne" },
  { id: "quad", label: "Quad" },
  { id: "parapente", label: "Parapente" },
  { id: "helicoptere", label: "Hélicoptère" },
  { id: "rafting", label: "Rafting" },
  { id: "tubing", label: "Tubing" },
  { id: "jetski", label: "Jet-ski" },
  { id: "kayak", label: "Kayak" },
  { id: "parachute", label: "Parachute ascensionnel" },
  { id: "snuba", label: "Snuba" },
  { id: "paddle", label: "Paddle" },
  { id: "surf", label: "Surf" },
  { id: "baleines", label: "Observation des baleines" },
  { id: "autre", label: "Autre" },
];
