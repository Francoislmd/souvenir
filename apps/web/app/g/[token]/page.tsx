import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { operatorVars } from "@/lib/color";
import { track } from "@/lib/analytics";
import { getBoutiquePhotos } from "@/lib/gallery";
import { accessFromOrders, remainingCapCents } from "@/lib/access";
import { departuresWithPhotos } from "@/lib/private-link";
import { getSeller } from "@/lib/seller";
import { formatDayFr, formatHourFr, formatSortieTitle, formatWhenFr } from "@/lib/format";
import { SaleHeader } from "@/components/gallery/SaleHeader";
import { BoutiqueGallery } from "@/components/gallery/BoutiqueGallery";
import galleryStyles from "@/components/gallery/gallery.module.css";
import styles from "./boutique.module.css";

// Page non authentifiée : le jeton est la clé. Elle doit toujours refléter
// les derniers prix et la dernière couleur choisis dans Réglages.
export const dynamic = "force-dynamic";

/**
 * La galerie privée d'un client. C'est la seule porte vers des photos : le
 * QR code de la sortie ne montre rien, il envoie ce lien par e-mail.
 *
 * Sortie de groupe : le client voit son départ et rien d'autre. Le départ
 * est indiqué par le prestataire, jamais choisi par le client ; s'il n'y en
 * a qu'un, il est attribué d'office.
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
    <div className={styles.page} style={operatorVars(operator.brandColor)}>
      <SaleHeader operatorName={operator.name} logoUrl={operator.logoUrl} />
      {children}
    </div>
  );

  if (sortie.mode === "GROUPE" && !participant.slotId) {
    const withPhotos = await departuresWithPhotos(sortie.id);

    if (withPhotos.length !== 1) {
      return page(
        <div className={galleryStyles.head}>
          <h1>{title}</h1>
          <p className={galleryStyles.sub}>{formatWhenFr(sortie.startsAt)}</p>
          <p className={galleryStyles.hint}>
            {withPhotos.length === 0
              ? "Vos photos arrivent. Ce lien reste le bon : revenez-y un peu plus tard."
              : `${operator.name} n'a pas encore indiqué votre départ. Ce lien reste le bon : revenez-y un peu plus tard.`}
          </p>
        </div>,
      );
    }

    // Un seul départ : c'est forcément le sien.
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

  const slot = participant.slotId ? await prisma.slot.findUnique({ where: { id: participant.slotId }, select: { startsAt: true, guide: true } }) : null;
  // Titre « Canyoning », au-dessus « 26 sept. » puis, en gras, « départ 10 h
  // avec Léa » : le client vérifie d'un coup d'œil que ce sont ses photos.
  const shortDay = (slot?.startsAt ?? sortie.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
  const guide = slot?.guide ?? sortie.guide;
  const context = {
    title: sortie.activity,
    line: shortDay,
    strong: slot ? `départ ${formatHourFr(slot.startsAt)}${guide ? ` avec ${guide}` : ""}` : guide ? `avec ${guide}` : null,
  };
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
      context={context}
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
