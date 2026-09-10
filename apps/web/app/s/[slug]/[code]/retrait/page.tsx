import { notFound } from "next/navigation";
import { getSortieSlots } from "@/lib/gallery-group";
import { resolveStore, publicStorePath, apiStoreBase } from "@/lib/store";
import { WithdrawPhotoPicker } from "@/components/gallery/WithdrawPhotoPicker";
import styles from "@/components/gallery/collective.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function WithdrawPage({ params }: { params: { slug: string; code: string } }) {
  const store = await resolveStore(params.slug, params.code);
  if (!store) notFound();

  const data = await getSortieSlots(store.sortie.id);
  if (!data) notFound();

  return (
    <div className={styles.page} style={{ "--op": store.operator.brandColor } as React.CSSProperties}>
      <WithdrawPhotoPicker
        basePath={publicStorePath(store.operator.slug, params.code.toLowerCase())}
        apiBase={apiStoreBase(store.operator.slug, params.code.toLowerCase())}
        operatorName={store.operator.name}
        dateLabel={data.dateLabel}
        slots={data.slots}
      />
    </div>
  );
}
