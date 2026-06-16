export const DEFAULT_DELIVERY_MESSAGE =
  "Salut {clientName} 👋 Voici tes photos et vidéos avec {operatorName} 📸 Clique sur le lien pour les découvrir :";

export function renderDeliveryMessage(
  template: string | null | undefined,
  vars: { clientName: string; operatorName: string },
): string {
  const base = template && template.trim() ? template : DEFAULT_DELIVERY_MESSAGE;
  return base
    .replace(/\{clientName\}/g, vars.clientName || "")
    .replace(/\{operatorName\}/g, vars.operatorName)
    .trim();
}

/** Titre par défaut de la galerie, prérempli et personnalisable par l'opérateur. */
export function defaultGalleryTitle(clientName: string): string {
  const firstName = clientName.trim().split(/\s+/)[0];
  return firstName ? `Le vol de ${firstName} 🤩` : "Quel vol 🤩";
}
