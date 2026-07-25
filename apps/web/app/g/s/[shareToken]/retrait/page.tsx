import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOperatorGroupDays } from "@/lib/gallery-group";
import { WithdrawPhotoPicker } from "@/components/gallery/WithdrawPhotoPicker";
import styles from "@/app/g/s/[shareToken]/collective.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function WithdrawPage({ params }: { params: { shareToken: string } }) {
  const operator = await prisma.operator.findUnique({ where: { shareToken: params.shareToken } });
  if (!operator) notFound();

  const data = await getOperatorGroupDays(params.shareToken);
  if (!data) notFound();

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <WithdrawPhotoPicker shareToken={params.shareToken} days={data.days} />
    </div>
  );
}
