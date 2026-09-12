import { notFound, redirect } from "next/navigation";
import { resolveSortieByCode, publicStorePath } from "@/lib/store";
import { dateKeyFor } from "@/lib/gallery-group";

// Le lien du QR code affiché à la fin de la journée. Il n'affiche plus rien
// lui-même : il redirige vers la boutique ouverte sur le jour de cette
// sortie, dont l'URL est celle que le client peut partager et remettre en
// favori. Les QR codes déjà imprimés continuent donc de marcher, et tout le
// parcours n'a plus qu'une seule forme d'adresse.
export const dynamic = "force-dynamic";

export default async function StoreSortiePage({ params }: { params: { slug: string; code: string } }) {
  const found = await resolveSortieByCode(params.slug, params.code);
  if (!found) notFound();

  redirect(`${publicStorePath(found.operator.slug)}?j=${dateKeyFor(found.startsAt)}`);
}
