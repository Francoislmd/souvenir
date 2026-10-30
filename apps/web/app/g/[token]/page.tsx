import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { operatorVars } from "@/lib/color";
import { track } from "@/lib/analytics";
import { getBoutiquePhotos } from "@/lib/gallery";
import { accessFromOrders, remainingCapCents } from "@/lib/access";
import { getSeller } from "@/lib/seller";
import { formatDayFr, formatSortieTitle, formatWhenFr } from "@/lib/format";
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
 * Sortie de groupe : le client voit toutes les photos de la sortie (plus de
 * notion de départ depuis le 30/10/2026).
 */
export default async function GalleryPage({ params }: { params: { token: string } }) {
  const participant = await prisma.participant.findUnique({
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

  // Sortie de groupe pas encore publiée : rien à montrer pour l'instant.
  if (sortie.mode === "GROUPE" && sortie.status !== "SENT") {
    return page(
      <div className={galleryStyles.head}>
        <h1>{title}</h1>
        <p className={galleryStyles.sub}>{formatWhenFr(sortie.startsAt)}</p>
        <p className={galleryStyles.hint}>Vos photos arrivent. Ce lien reste le bon : revenez-y un peu plus tard.</p>
      </div>,
    );
  }

  const access = accessFromOrders(participant.orders, operator.priceAllCents);
  const photos = await getBoutiquePhotos(
    { id: participant.id, sortieId: participant.sortieId, slotId: participant.slotId },
    access.ids,
    operator.name,
    access.packReached,
  );
  const purchasedIds = access.packReached ? photos.map((p) => p.id) : Array.from(access.ids);

  // Titre « Vos photos de canyoning », au-dessus les pastilles : « vendredi
  // 26 sept. », « avec Léa », le nombre de photos. Le client vérifie d'un
  // coup d'œil que ce sont les siennes.
  const shortDay = sortie.startsAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Paris" });
  const context = {
    title: sortie.activity,
    line: shortDay,
    strong: sortie.guide ? `avec ${sortie.guide}` : null,
    // Titre « Vos photos du samedi 26 septembre », pastille du lieu dessous.
    day: formatDayFr(sortie.startsAt),
    place: sortie.place,
  };
  const when = formatWhenFr(sortie.startsAt);

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
      operatorLogoUrl={operator.logoUrl}
      seller={seller}
      receiptTo={receiptTo}
    />,
  );
}
