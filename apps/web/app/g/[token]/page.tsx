import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getPreviewUrl, getOriginalSignedUrl } from "@/lib/storage";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { BoutiqueGallery, type BoutiquePhoto } from "@/components/gallery/BoutiqueGallery";
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

  const rawPhotos = await prisma.photo.findMany({
    where: {
      sortieId: participant.sortieId,
      status: "READY",
      OR: [{ ownerId: participant.id }, { ownerId: null }],
    },
    orderBy: { createdAt: "asc" },
  });

  const photos: BoutiquePhoto[] = await Promise.all(
    rawPhotos.map(async (p) => {
      const unlocked = p.isFreeSample || purchasedSet.has(p.id);
      // Verrouillée : on sert le JPEG flouté généré côté serveur (pixels réellement
      // flous), jamais l'aperçu net avec un filter CSS — récupérable en un clic.
      // Repli : si le worker n'a pas encore généré ce blurKey (déploiement en
      // retard, ou photo traitée avant l'ajout de cette étape), on sert l'aperçu
      // net mais le composant applique alors un flou CSS temporaire — imparfait,
      // mais mieux que de montrer la photo intacte.
      const lockedKey = p.blurKey ?? p.previewKey ?? p.thumbKey;
      const previewUrl = unlocked
        ? p.previewKey
          ? getPreviewUrl(p.previewKey)
          : p.thumbKey
            ? getPreviewUrl(p.thumbKey)
            : null
        : lockedKey
          ? getPreviewUrl(lockedKey)
          : null;
      return {
        id: p.id,
        previewUrl,
        previewIsBlurred: unlocked || !!p.blurKey,
        // Jamais d'original pour une photo non achetée et non offerte (critère d'acceptation #4).
        originalUrl: unlocked ? await getOriginalSignedUrl(p.originalKey) : null,
        isFreeSample: p.isFreeSample,
        isVideo: p.isVideo,
      };
    }),
  );

  const reducedOfferActive = !!participant.reducedOfferExpiresAt && participant.reducedOfferExpiresAt > new Date();
  const dateLabel = `Sortie du ${formatDateFr(participant.sortie.startsAt)}${participant.sortie.place ? ` · ${participant.sortie.place}` : ""}`;

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <GalleryHeader operatorName={operator.name} dateLabel={dateLabel} />
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
