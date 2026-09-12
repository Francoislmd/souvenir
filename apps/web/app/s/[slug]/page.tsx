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

// Le titre d'onglet vient du layout, écrit pour la landing : c'est
// l'argumentaire destiné aux prestataires, affiché à un client qui achète ses
// photos. Il porte donc ici le nom de son prestataire, et le mot utile en
// premier, seul à survivre quand l'onglet rétrécit.
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const found = await resolveOperator(params.slug);
  const name = found?.name;
  return {
    title: name ? `Vos photos · ${name}` : "Vos photos",
    robots: { index: false, follow: false },
  };
}

// `j` = le jour affiché, `c` = le créneau ouvert. Deux paramètres courts
// parce qu'ils se retrouvent dans un lien qu'un client colle dans une
// conversation. Ils sont vérifiés par StoreScreen, jamais crus sur parole.
export default async function StorePage({ params, searchParams }: { params: { slug: string }; searchParams: { j?: string | string[]; c?: string | string[] } }) {
  const operator = await resolveOperator(params.slug);
  if (!operator) notFound();

  return <StoreScreen operator={operator} dateKey={first(searchParams.j)} slotId={first(searchParams.c)} />;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
