import { notFound } from "next/navigation";
import { getOperatorGroupDays } from "@/lib/gallery-group";
import { resolveOperator, publicStorePath, apiStoreBase } from "@/lib/store";
import { WithdrawPhotoPicker } from "@/components/gallery/WithdrawPhotoPicker";
import styles from "@/components/gallery/collective.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

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
