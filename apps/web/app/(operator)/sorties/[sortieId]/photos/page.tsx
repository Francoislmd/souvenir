import { redirect } from "next/navigation";

/**
 * Le dépôt des photos n'est plus une page à part : la sortie est un seul
 * écran qui change d'état. La route reste pour les liens déjà partagés
 * (emails, favoris) et renvoie sur la sortie.
 */
export default function SortiePhotosPage({ params }: { params: { sortieId: string } }) {
  redirect(`/sorties/${params.sortieId}`);
}
