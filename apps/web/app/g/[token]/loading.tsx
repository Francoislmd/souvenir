import { LoadingBlock } from "@/components/ui/Spinner";

// La galerie lit la commande et signe les aperçus côté serveur : entre le
// clic sur le lien de l'email et l'affichage, il y a une vraie attente.
export default function Loading() {
  return <LoadingBlock label="Chargement de vos photos…" pad={140} />;
}
