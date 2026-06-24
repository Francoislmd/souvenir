import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getPreviewUrl } from "@/lib/storage";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/checkout-fulfillment";
import { type GalleryMedia } from "@/components/gallery/MediaTile";
import { MediaFeed } from "@/components/gallery/MediaFeed";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { ReviewSection } from "@/components/gallery/ReviewSection";
import { InstagramShareSection } from "@/components/gallery/InstagramShareSection";
import { CheckoutButton } from "@/components/gallery/CheckoutButton";
import { MarketingCtas } from "@/components/gallery/MarketingCtas";
import { PurchaseSuccessRefresher } from "@/components/gallery/PurchaseSuccessRefresher";
import { UnlockCelebration } from "@/components/gallery/UnlockCelebration";
import { LogoMark } from "@/components/brand/Logo";
import { CLIENT_BRAND_COLOR } from "@/lib/brand";
import { defaultGalleryTitle, extractHashtags } from "@/lib/message-templates";

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { purchase?: string; session_id?: string };
}) {
  const tokenFilter = {
    OR: [{ token: params.token }, { code: params.token.toUpperCase() }],
  };

  // Deux requêtes DB en parallèle — aucune dépendance entre elles
  const [rawDelivery, priorOpenCount] = await Promise.all([
    prisma.delivery.findFirst({
      where: tokenFilter,
      include: {
        media: { orderBy: { id: "asc" } },
        session: { include: { operator: true } },
      },
    }),
    prisma.event.count({
      where: {
        name: "gallery_opened",
        delivery: { OR: [{ token: params.token }, { code: params.token.toUpperCase() }] },
      },
    }),
  ]);

  if (!rawDelivery) notFound();

  // Stripe fallback — seulement après un checkout, cas rare
  let delivery: typeof rawDelivery;
  if (
    searchParams.purchase === "success" &&
    searchParams.session_id &&
    rawDelivery.status !== "PURCHASED"
  ) {
    const checkoutSession = await stripe.checkout.sessions.retrieve(searchParams.session_id);
    if (checkoutSession.metadata?.deliveryId === rawDelivery.id) {
      await fulfillCheckoutSession(checkoutSession);
      delivery = await prisma.delivery.findUniqueOrThrow({
        where: { id: rawDelivery.id },
        include: {
          media: { orderBy: { id: "asc" } },
          session: { include: { operator: true } },
        },
      });
    } else {
      delivery = rawDelivery;
    }
  } else {
    delivery = rawDelivery;
  }

  const operator = delivery.session.operator;
  const isMarketing = delivery.session.mode === "MARKETING";
  const unlocked = isMarketing || delivery.status === "PURCHASED";

  // Claim (1ère ouverture) : await pour la cohérence du funnel analytics
  if (priorOpenCount === 0) {
    await prisma.delivery.updateMany({
      where: { id: delivery.id, status: "CREATED" },
      data: { consentImage: true, status: "CLAIMED", claimedAt: new Date() },
    });
  }

  // Analytics : fire-and-forget — ne bloque pas la réponse
  void track("gallery_opened", { operatorId: operator.id, deliveryId: delivery.id });

  const media: GalleryMedia[] = delivery.media.map((item) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    previewUrl: item.previewKey ? getPreviewUrl(item.previewKey) : null,
    thumbUrl: item.thumbKey ? getPreviewUrl(item.thumbKey) : null,
  }));

  const showPurchaseRefresher = searchParams.purchase === "success" && !unlocked;
  const justUnlocked = searchParams.purchase === "success" && unlocked;
  const sessionDate = delivery.session.date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
  const photoCount = delivery.media.filter((m) => m.kind === "PHOTO").length;
  const videoCount = delivery.media.filter((m) => m.kind === "VIDEO").length;
  const heroTitle = delivery.title ?? defaultGalleryTitle(delivery.clientName ?? "");
  const hashtags = extractHashtags(operator.instagramPostCaption);

  const themeStyle = {
    "--accent": CLIENT_BRAND_COLOR,
    "--accent-tint": `color-mix(in srgb, ${CLIENT_BRAND_COLOR} 12%, white)`,
  } as React.CSSProperties;

  const headerProps = {
    operator: { name: operator.name, logoUrl: operator.logoUrl },
    location: operator.location,
    sessionDate,
    heroTitle,
    photoCount,
    videoCount,
    instagramHandle: operator.instagramHandle,
    hashtags,
  };

  const emptyState = (
    <div
      className="flex aspect-square w-full items-center justify-center rounded-card"
      style={{
        background: `linear-gradient(160deg, ${CLIENT_BRAND_COLOR}, ${CLIENT_BRAND_COLOR}99)`,
      }}
    >
      <p className="px-8 text-center text-sm font-medium text-white/90">
        Tes médias arrivent, reviens dans une minute 🙂
      </p>
    </div>
  );

  const statusCard = isMarketing ? (
    <div className="flex items-center gap-3 rounded-card border border-border bg-gradient-to-br from-accent-tint to-surface px-4 py-4 shadow-card">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-2xl shadow-card">
        🎁
      </span>
      <div>
        <p className="text-base font-semibold text-ink">Cadeau de {operator.name}</p>
        <p className="text-sm text-ink-2">Tout est à toi, gratuitement, en HD et sans filigrane.</p>
      </div>
    </div>
  ) : unlocked ? (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-card border border-border shadow-card">
        <div className="flex items-center gap-3 bg-gradient-to-br from-success-tint to-surface px-4 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-2xl shadow-card">
            🎉
          </span>
          <div>
            <p className="text-base font-semibold text-ink">C&apos;est débloqué !</p>
            <p className="text-sm text-ink-2">Toutes tes photos et vidéos, en HD, sans filigrane.</p>
          </div>
        </div>
        <a
          href={`/api/gallery/${delivery.token}/zip`}
          className="flex items-center justify-center gap-2 border-t border-border bg-surface py-3 text-sm font-semibold text-ink transition hover:bg-canvas active:bg-canvas"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Tout télécharger (.zip)
        </a>
      </div>
      <ReviewSection
        token={delivery.token}
        operatorName={operator.name}
        googleReviewUrl={operator.googleReviewUrl}
        trustpilotUrl={operator.trustpilotUrl}
        tripadvisorUrl={operator.tripadvisorUrl}
      />
      {operator.instagramHandle ? (
        <InstagramShareSection
          token={delivery.token}
          operator={{
            name: operator.name,
            instagramHandle: operator.instagramHandle,
            instagramPostCaption: operator.instagramPostCaption,
          }}
          hashtags={hashtags}
        />
      ) : null}
    </div>
  ) : null;

  const marketingCtasProps = {
    token: delivery.token,
    operator: {
      name: operator.name,
      googleReviewUrl: operator.googleReviewUrl,
      trustpilotUrl: operator.trustpilotUrl,
      tripadvisorUrl: operator.tripadvisorUrl,
      instagramHandle: operator.instagramHandle,
      instagramPostCaption: operator.instagramPostCaption,
    },
    hashtags,
    initialEmail: delivery.clientEmail,
  };

  const footerContent = (
    <footer className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <LogoMark className="h-4 w-4 rounded-[4px]" />
        via Souvenir
      </span>
      <Link href={`/g/${delivery.token}/confidentialite`} className="underline">
        Confidentialité
      </Link>
    </footer>
  );

  return (
    <main className="relative min-h-screen bg-surface" style={themeStyle}>
      {/* Effets globaux — pas de rendu visuel, une seule instance */}
      {justUnlocked ? <UnlockCelebration id={delivery.id} /> : null}
      {showPurchaseRefresher ? <PurchaseSuccessRefresher /> : null}

      <div className={`md:flex md:items-start ${!isMarketing && !unlocked ? "pb-24 md:pb-0" : "pb-10 md:pb-0"}`}>

        {/* ===== PANNEAU GAUCHE : header + CTAs — desktop uniquement ===== */}
        <div className="hidden md:flex md:sticky md:top-0 md:h-screen md:w-[420px] md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-border">
          <GalleryHeader {...headerProps} />
          <div className="mt-5 flex-1 px-4 pb-10">
            {statusCard}
            {isMarketing ? (
              <div className="mt-5">
                <MarketingCtas {...marketingCtasProps} />
              </div>
            ) : null}
            {!isMarketing && !unlocked ? (
              <div className="mt-5">
                <CheckoutButton deliveryId={delivery.id} priceCents={operator.packPriceCents} inline />
              </div>
            ) : null}
            {footerContent}
          </div>
        </div>

        {/* ===== CONTENU PRINCIPAL (mobile : colonne, desktop : panneau droit flex-1) ===== */}
        <div className="flex-1 min-w-0">
          {/* Header — mobile uniquement */}
          <div className="md:hidden">
            <GalleryHeader {...headerProps} />
          </div>

          {/* Grille de médias — rendue UNE SEULE FOIS, classes responsives */}
          <div className="mt-4 px-4 pb-4 md:min-h-screen md:bg-canvas md:p-4 lg:p-6">
            {media.length > 0 ? (
              <MediaFeed
                media={media}
                token={delivery.token}
                locked={!unlocked}
                gridClassName="grid grid-cols-3 gap-0.5 md:gap-1 lg:grid-cols-4"
              />
            ) : (
              emptyState
            )}
          </div>

          {/* CTAs + consentement + footer — mobile uniquement */}
          <div className="md:hidden mt-1 px-4 pb-6">
            {statusCard}
            {isMarketing ? (
              <div className="mt-5">
                <MarketingCtas {...marketingCtasProps} />
              </div>
            ) : null}
            {footerContent}
          </div>
        </div>
      </div>

      {/* Bouton de paiement flottant — mobile uniquement */}
      {!isMarketing && !unlocked ? (
        <div className="md:hidden">
          <CheckoutButton deliveryId={delivery.id} priceCents={operator.packPriceCents} />
        </div>
      ) : null}
    </main>
  );
}
