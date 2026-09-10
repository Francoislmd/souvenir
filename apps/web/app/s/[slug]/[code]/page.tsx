import { notFound } from "next/navigation";
import { resolveSortieByCode } from "@/lib/store";
import { StoreScreen } from "@/components/store/StoreScreen";

// Le lien d'une sortie précise, celui du QR code affiché à la fin de la
// journée : il n'affiche que les créneaux de CETTE sortie. Ouvrir seulement
// son jour ne suffisait pas, un même jour pouvant porter plusieurs sorties du
// même opérateur. Le code n'est plus un secret, la boutique est publique,
// mais il désigne bien une sortie et une seule.
export const dynamic = "force-dynamic";

// Le titre d'onglet vient du layout, écrit pour la landing : c'est
// l'argumentaire destiné aux prestataires, affiché à un client qui achète ses
// photos. Il porte donc ici le nom de son prestataire, et le mot utile en
// premier, seul à survivre quand l'onglet rétrécit.
export async function generateMetadata({ params }: { params: { slug: string; code: string } }) {
  const found = await resolveSortieByCode(params.slug, params.code);
  const name = found?.operator.name;
  return {
    title: name ? `Vos photos · ${name}` : "Vos photos",
    robots: { index: false, follow: false },
  };
}

export default async function StoreSortiePage({ params }: { params: { slug: string; code: string } }) {
  const found = await resolveSortieByCode(params.slug, params.code);
  if (!found) notFound();

  return <StoreScreen operator={found.operator} sortieId={found.sortieId} />;
}
