const DEFAULT_GALLERY_MESSAGE =
  "Salut {clientName} 👋 Voici tes photos avec {operatorName} 📸 Clique sur le lien pour les découvrir :";

export function renderGalleryMessage(vars: { clientName: string; operatorName: string }): string {
  return DEFAULT_GALLERY_MESSAGE.replace(/\{clientName\}/g, vars.clientName || "")
    .replace(/\{operatorName\}/g, vars.operatorName)
    .trim();
}
