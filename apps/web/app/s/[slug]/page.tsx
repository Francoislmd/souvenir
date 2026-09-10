import { redirect } from "next/navigation";

/**
 * store.linktrip.co/{slug} sans le code de la sortie.
 *
 * On n'y arrive qu'en tronquant une URL : le lien complet est entre les mains
 * de qui a fait la sortie, et le slug seul n'ouvre aucune photo, par
 * construction. Une page de marque y a existé le temps d'un aller-retour,
 * elle ne disait rien que le visiteur ne sache déjà. Renvoi sur le site
 * plutôt qu'une page à moitié vide ou un 404.
 *
 * Redirection temporaire, pas permanente : si une vraie vitrine de
 * prestataire voit le jour, elle reprendra cette adresse, et un 308 déjà
 * enregistré par les navigateurs l'empêcherait de s'afficher.
 */
export default function StoreFrontPage() {
  redirect(process.env.NEXT_PUBLIC_APP_URL ?? "https://linktrip.co");
}
