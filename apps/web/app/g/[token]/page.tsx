import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getBoutiquePhotos } from "@/lib/gallery";
import { accessFromOrders, remainingCapCents } from "@/lib/access";
import { getSeller } from "@/lib/seller";
import { formatDayFr, formatHourFr, formatSortieTitle, formatWhenFr } from "@/lib/format";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { BoutiqueGallery } from "@/components/gallery/BoutiqueGallery";
import { SlotChooser } from "@/components/gallery/SlotChooser";
import galleryStyles from "@/components/gallery/gallery.module.css";
import styles from "./boutique.module.css";

// Page non authentifiée : le jeton est la clé. Elle doit toujours refléter
// les derniers prix et la dernière couleur choisis dans Réglages.
export const dynamic = "force-dynamic";

/**
 * La galerie privée d'un client. C'est la seule porte vers des photos : le
 * QR code de la sortie ne montre rien, il envoie ce lien par e-mail.
 *
 * Sortie de groupe : le client voit son départ et rien d'autre. S'il est
 * arrivé par le QR code, il n'a pas encore de départ ; il le choisit à la
 * première ouverture (ou on le choisit pour lui s'il n'y en a qu'un).
 */
export default async function GalleryPage({ params }: { params: { token: string } }) {
  let participant = await prisma.participant.findUnique({
    where: { token: params.token },
    include: { sortie: { include: { operator: true } }, orders: true },
  });

  if (!participant || participant.deletedAt) notFound();

  const isFirstOpen = !participant.openedAt;
  if (isFirstOpen) {
    await prisma.participant.update({ where: { id: participant.id }, data: { openedAt: new Date() } });
  }
  void track("gallery_opened", { operatorId: participant.sortie.operatorId, participantId: participant.id });

  const sortie = participant.sortie;
  const operator = sortie.operator;
  const title = formatSortieTitle(sortie.activity, sortie.place);
  const page = (children: React.ReactNode) => (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <GalleryHeader operatorName={operator.name} logoUrl={operator.logoUrl} />
      {children}
    </div>
  );

  if (sortie.mode === "GROUPE" && !participant.slotId) {
    const slots = await prisma.slot.findMany({
      where: { sortieId: sortie.id },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } } },
    });
    const withPhotos = slots.filter((s) => s._count.photos > 0);

    if (withPhotos.length === 0) {
      return page(
        <div className={galleryStyles.head}>
          <h1>{title}</h1>
          <p className={galleryStyles.sub}>{formatWhenFr(sortie.startsAt)}</p>
          <p className={galleryStyles.hint}>Vos photos arrivent. Ce lien reste le bon : revenez-y un peu plus tard.</p>
        </div>,
      );
    }

    if (withPhotos.length > 1) {
      return page(
        <SlotChooser
          token={participant.token}
          dayLabel={`${title}, ${formatDayFr(sortie.startsAt).toLowerCase()}`}
          slots={withPhotos.map((s) => ({
            id: s.id,
            hour: formatHourFr(s.startsAt),
            activity: s.guide ? `Avec ${s.guide}` : sortie.activity,
            photoCount: s._count.photos,
          }))}
        />,
      );
    }

    // Un seul départ : pas de question à poser.
    await prisma.participant.updateMany({ where: { id: participant.id, slotId: null }, data: { slotId: withPhotos[0]!.id } });
    participant = { ...participant, slotId: withPhotos[0]!.id };
  }

  const access = accessFromOrders(participant.orders, operator.priceAllCents);
  const photos = await getBoutiquePhotos(
    { id: participant.id, sortieId: participant.sortieId, slotId: participant.slotId },
    access.ids,
    operator.name,
    access.packReached,
  );
  const purchasedIds = access.packReached ? photos.map((p) => p.id) : Array.from(access.ids);

  const slot = participant.slotId ? await prisma.slot.findUnique({ where: { id: participant.slotId }, select: { startsAt: true } }) : null;
  const when = slot ? `${formatDayFr(slot.startsAt)}, départ de ${formatHourFr(slot.startsAt)}` : formatWhenFr(sortie.startsAt);

  const seller = await getSeller(operator.id);
  // Le reçu part par le canal du participant (lib/order-fulfillment.ts).
  const receiptTo = participant.channel === "WHATSAPP" ? "WhatsApp" : participant.contact;
  const reducedOfferActive = !!participant.reducedOfferExpiresAt && participant.reducedOfferExpiresAt > new Date();

  return page(
    <BoutiqueGallery
      token={participant.token}
      participantId={participant.id}
      title={title}
      when={when}
      photos={photos}
      pricing={{
        pricePhotoCents: operator.pricePhotoCents,
        // Après un premier achat, le pack ne coûte plus que ce qui manque.
        priceAllCents: remainingCapCents(access, operator.priceAllCents),
      }}
      packOnly={operator.packOnly}
      bought={access.bought}
      packReached={access.packReached}
      purchasedIds={purchasedIds}
      googleReviewUrl={operator.googleReviewUrl}
      reducedOfferActive={reducedOfferActive}
      operatorName={operator.name}
      seller={seller}
      receiptTo={receiptTo}
    />,
  );
}
