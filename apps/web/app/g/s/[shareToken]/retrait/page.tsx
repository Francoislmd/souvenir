import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGroupSlots } from "@/lib/gallery-group";
import { WithdrawPhotoPicker } from "@/components/gallery/WithdrawPhotoPicker";
import styles from "@/app/g/s/[shareToken]/collective.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function WithdrawPage({ params }: { params: { shareToken: string } }) {
  const sortie = await prisma.sortie.findUnique({ where: { shareToken: params.shareToken }, include: { operator: true } });
  if (!sortie || sortie.mode !== "GROUPE") notFound();

  const data = await getGroupSlots(params.shareToken);
  if (!data) notFound();

  return (
    <div className={styles.page} style={{ "--op": sortie.operator.brandColor } as React.CSSProperties}>
      <WithdrawPhotoPicker shareToken={params.shareToken} slots={data.slots} />
    </div>
  );
}
