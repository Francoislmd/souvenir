import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getBoutiquePhotos } from "@/lib/gallery";
import { formatSortieTitle, formatWhenFr } from "@/lib/format";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { BoutiqueGallery } from "@/components/gallery/BoutiqueGallery";
import styles from "./boutique.module.css";

// Page publique, non authentifiée — doit toujours refléter les derniers prix
// et la dernière couleur choisis dans Réglages (critère d'acceptation #7).
export const dynamic = "force-dynamic";

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
  const purchasedIds = bought ? participant.order!.photoIds : [];

  const photos = await getBoutiquePhotos(
    { id: participant.id, sortieId: participant.sortieId, slotId: participant.slotId },
    new Set(purchasedIds),
    operator.name,
  );

  const reducedOfferActive = !!participant.reducedOfferExpiresAt && participant.reducedOfferExpiresAt > new Date();

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <GalleryHeader operatorName={operator.name} logoUrl={operator.logoUrl} />
      <BoutiqueGallery
        token={participant.token}
        participantId={participant.id}
        // Le titre dit de quelle sortie il s'agit — c'est ce que le client
        // vérifie en premier, et ça marche aussi bien pour une galerie
        // nominative que pour un lien de groupe, où il n'y a pas de prénom.
        title={formatSortieTitle(participant.sortie.activity, participant.sortie.place)}
        when={formatWhenFr(participant.sortie.startsAt)}
        photos={photos}
        pricing={{
          pricePhotoCents: operator.pricePhotoCents,
          priceAllCents: operator.priceAllCents,
        }}
        packOnly={operator.packOnly}
        bought={bought}
        purchasedIds={purchasedIds}
        googleReviewUrl={operator.googleReviewUrl}
        reducedOfferActive={reducedOfferActive}
      />
    </div>
  );
}
