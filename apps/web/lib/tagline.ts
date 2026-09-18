import { ACTIVITIES } from "@/lib/onboarding/activities";

/**
 * La phrase sous le nom, sur l'accueil de la boutique : ce que fait le
 * prestataire, pour qu'un client qui vient de scanner un QR code reconnaisse
 * l'endroit avant de chercher son jour.
 *
 * Par défaut elle se compose des activités cochées, donc aucune boutique
 * sans phrase ; le pro peut la réécrire (Operator.tagline), et cette version
 * reprend la main dès qu'il vide le champ. « Autre » est écarté :
 * il ne dit rien à un client. Au-delà de quatre activités la liste devient
 * un inventaire, on s'arrête à trois.
 */
export function operatorTagline(activityIds: string[]): string {
  const labels = activityIds
    .filter((id) => id !== "autre")
    .map((id) => ACTIVITIES.find((a) => a.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  if (labels.length === 0) return "";

  // Seule la première garde sa majuscule : c'est une phrase, pas une liste.
  const join = (list: string[]): string => list.map((l, i) => (i === 0 ? l : l.toLowerCase())).join(", ");

  if (labels.length > 4) return `${join(labels.slice(0, 3))} et d'autres activités.`;
  if (labels.length === 1) return `${labels[0]}.`;
  return `${join(labels.slice(0, -1))} et ${labels[labels.length - 1]!.toLowerCase()}.`;
}
