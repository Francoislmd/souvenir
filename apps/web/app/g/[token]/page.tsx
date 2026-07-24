import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getBoutiquePhotos } from "@/lib/gallery";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { BoutiqueGallery } from "@/components/gallery/BoutiqueGallery";
import styles from "./boutique.module.css";

// Page publique, non authentifiée — doit toujours refléter les derniers prix
// et la dernière couleur choisis dans Réglages (critère d'acceptation #7).
export const dynamic = "force-dynamic";

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default async function GalleryPage({ params }: { params: { token: string } }) {
  const participant = await prisma.participant.findUnique({
    where: { token: params.token },
    include: { sortie: { include: { operator: true } }, order: true },
  });

  if (!participant || participant.deletedAt) notFound();

  const isFirstOpen = !participant.openedAt;
  if (isFirstOpen) {
    await prisma.participant.update({ where: { id: participant.id }, data: { openedAt: new Date() } });
  }
  void track("gallery_opened", { operatorId: participant.sortie.operatorId, participantId: participant.id });

  const operator = participant.sortie.operator;
  const bought = participant.order?.status === "succeeded";
  const purchasedIds = participant.order?.status === "succeeded" ? participant.order.photoIds : [];
  const purchasedSet = new Set(purchasedIds);

  const photos = await getBoutiquePhotos(participant, purchasedSet);

  const reducedOfferActive = !!participant.reducedOfferExpiresAt && participant.reducedOfferExpiresAt > new Date();
  const dateLabel = `Sortie du ${formatDateFr(participant.sortie.startsAt)}${participant.sortie.place ? ` · ${participant.sortie.place}` : ""}`;

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <GalleryHeader operatorName={operator.name} logoUrl={operator.logoUrl} dateLabel={dateLabel} />
      <BoutiqueGallery
        token={participant.token}
        participantId={participant.id}
        clientFirstName={participant.name.split(/\s+/)[0] ?? participant.name}
        photos={photos}
        pricing={{
          pricePhotoCents: operator.pricePhotoCents,
          pricePackCents: operator.pricePackCents,
          priceAllCents: operator.priceAllCents,
          packSize: operator.packSize,
        }}
        bought={bought}
        purchasedIds={purchasedIds}
        googleReviewUrl={operator.googleReviewUrl}
        reducedOfferActive={reducedOfferActive}
      />
    </div>
  );
}
