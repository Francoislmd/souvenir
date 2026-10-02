import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBoutiquePhotos } from "@/lib/gallery";
import { PrivateWithdraw } from "@/components/gallery/PrivateWithdraw";
import styles from "@/components/gallery/collective.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Retirer une photo", robots: { index: false, follow: false } };

export default async function PrivateWithdrawPage({ params }: { params: { token: string } }) {
  const participant = await prisma.participant.findUnique({
    where: { token: params.token },
    include: { sortie: { include: { operator: true } } },
  });
  if (!participant || participant.deletedAt) notFound();
  // Pas encore de départ choisi : il n'y a rien à montrer, donc rien à retirer.
  if (participant.sortie.mode === "GROUPE" && !participant.slotId) redirect(`/g/${participant.token}`);

  const operator = participant.sortie.operator;
  const photos = await getBoutiquePhotos(
    { id: participant.id, sortieId: participant.sortieId, slotId: participant.slotId },
    new Set(),
    operator.name,
  );

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <PrivateWithdraw
        token={participant.token}
        operatorName={operator.name}
        photos={photos.map((p) => ({ id: p.id, previewUrl: p.previewUrl, isVideo: p.isVideo, durationSec: p.durationSec }))}
      />
    </div>
  );
}
