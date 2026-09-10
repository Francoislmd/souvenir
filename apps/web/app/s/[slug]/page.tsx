import { notFound } from "next/navigation";
import { resolveOperator } from "@/lib/store";
import { StoreScreen } from "@/components/store/StoreScreen";

// La boutique d'un opérateur : store.linktrip.co/{slug}. Une seule adresse,
// permanente, réutilisée par toutes ses sorties. Le slug est lisible donc
// devinable, et c'est assumé : la boutique est publique, les aperçus restent
// filigranés et le lien "demander le retrait" est le recours de quiconque ne
// veut pas y figurer.
//
// Doit toujours refléter les derniers créneaux publiés et les derniers
// prix/couleur choisis dans Réglages (même raison que la boutique
// individuelle).
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function StorePage({ params }: { params: { slug: string } }) {
  const operator = await resolveOperator(params.slug);
  if (!operator) notFound();

  return <StoreScreen operator={operator} />;
}
