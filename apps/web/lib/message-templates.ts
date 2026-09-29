// Vouvoiement, comme le reste des messages du parcours client : le reçu qui
// suit l'achat arrive dans le même fil WhatsApp, et le tutoiement de
// l'ancienne version (« Salut 👋 Voici tes photos ») juraient avec lui.
const DEFAULT_GALLERY_MESSAGE = "Bonjour {clientName}, vos photos avec {operatorName} sont prêtes. Elles vous attendent ici :";

export function renderGalleryMessage(vars: { clientName: string; operatorName: string }): string {
  return DEFAULT_GALLERY_MESSAGE.replace(/\{clientName\}/g, vars.clientName || "")
    .replace(/\{operatorName\}/g, vars.operatorName)
    // Sans prénom : « Bonjour, vos photos… », pas « Bonjour , vos photos… ».
    .replace(/\s+,/g, ",")
    .trim();
}
