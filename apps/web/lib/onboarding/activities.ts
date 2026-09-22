// Catalogue des activités proposées à l'onboarding et à la création d'une
// sortie. Le rendu visuel (emoji + teinte) associé à chaque activité vit
// dans lib/activity-visuals.ts, matché sur le label.
export interface ActivityDef {
  id: string;
  label: string;
}

/* Même périmètre que les pages /activites du site (components/marketing/
   activitesNav.ts), plus le parachute ascensionnel. Les verticales visées en
   prospection d'abord, puis le reste par milieu. Les id existants ne changent
   pas : ils sont stockés dans Operator.activities. */
export const ACTIVITIES: ActivityDef[] = [
  { id: "rafting", label: "Rafting" },
  { id: "parachute", label: "Parachute ascensionnel" },
  { id: "jetski", label: "Jet-ski" },
  { id: "parapente", label: "Parapente" },
  { id: "bouee", label: "Bouée tractée" },
  { id: "ski-nautique", label: "Ski nautique" },
  { id: "canyoning", label: "Canyoning" },
  { id: "kayak", label: "Kayak" },
  { id: "paddle", label: "Paddle" },
  { id: "surf", label: "Surf" },
  { id: "plongee", label: "Plongée" },
  { id: "helicoptere", label: "Hélicoptère" },
  { id: "tyrolienne", label: "Tyrolienne" },
  { id: "quad", label: "Quad" },
  { id: "parc-aventure", label: "Parc aventure" },
  { id: "autre", label: "Autre" },
];
