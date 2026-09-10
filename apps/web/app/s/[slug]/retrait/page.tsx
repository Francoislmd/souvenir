import { notFound } from "next/navigation";
import { getOperatorGroupDays } from "@/lib/gallery-group";
import { resolveOperator, publicStorePath, apiStoreBase } from "@/lib/store";
import { WithdrawPhotoPicker } from "@/components/gallery/WithdrawPhotoPicker";
import styles from "@/components/gallery/collective.module.css";

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

export default async function WithdrawPage({ params }: { params: { slug: string } }) {
  const operator = await resolveOperator(params.slug);
  if (!operator) notFound();

  const data = await getOperatorGroupDays(operator.slug);
  if (!data) notFound();

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <WithdrawPhotoPicker
        basePath={publicStorePath(operator.slug)}
        apiBase={apiStoreBase(operator.slug)}
        operatorName={operator.name}
        days={data.days}
      />
    </div>
  );
}
