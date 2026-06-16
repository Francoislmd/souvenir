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
import { ReviewLink } from "@/components/gallery/ReviewLink";
import { actionCardClass, ActionCardContent } from "@/components/gallery/ActionCard";
import { CheckoutButton } from "@/components/gallery/CheckoutButton";
import { MarketingCtas } from "@/components/gallery/MarketingCtas";
import { ConsentToggle } from "@/components/gallery/ConsentToggle";
import { PurchaseSuccessRefresher } from "@/components/gallery/PurchaseSuccessRefresher";
import { UnlockCelebration } from "@/components/gallery/UnlockCelebration";
import { LogoMark } from "@/components/brand/Logo";
import { CLIENT_BRAND_COLOR } from "@/lib/brand";
import { defaultGalleryTitle } from "@/lib/message-templates";

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { purchase?: string; session_id?: string };
}) {
  // Le QR pointe sur le token, le lien court de secours sur le code à 6 caractères.
  let delivery = await prisma.delivery.findFirst({
    where: { OR: [{ token: params.token }, { code: params.token.toUpperCase() }] },
    include: {
      media: { orderBy: { id: "asc" } },
      session: { include: { operator: true } },
    },
  });

  if (!delivery) notFound();

  // Filet de sécurité : si on revient de Checkout et que le webhook Stripe n'est
  // pas encore (ou jamais) passé (ex: en local sans `stripe listen`), on vérifie
  // et finalise nous-mêmes l'achat — idempotent.
  if (searchParams.purchase === "success" && searchParams.session_id && delivery.status !== "PURCHASED") {
    const checkoutSession = await stripe.checkout.sessions.retrieve(searchParams.session_id);
    if (checkoutSession.metadata?.deliveryId === delivery.id) {
      await fulfillCheckoutSession(checkoutSession);
      delivery = await prisma.delivery.findUniqueOrThrow({
        where: { id: delivery.id },
        include: {
          media: { orderBy: { id: "asc" } },
          session: { include: { operator: true } },
        },
      });
    }
  }

  const operator = delivery.session.operator;
  const isMarketing = delivery.session.mode === "MARKETING";
  const unlocked = isMarketing || delivery.status === "PURCHASED";

  const priorOpens = await prisma.event.count({ where: { deliveryId: delivery.id, name: "gallery_opened" } });
  await track("gallery_opened", { operatorId: operator.id, deliveryId: delivery.id });

  // Parcours simplifié : le scan ouvre la galerie directement, donc la 1ère ouverture
  // EST le claim (dénominateur de l'attach rate) et vaut consentement implicite.
  let consentImage = delivery.consentImage;
  if (priorOpens === 0) {
    consentImage = true;
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: { consentImage: true, status: "CLAIMED", claimedAt: new Date() },
    });
  }

  const media: GalleryMedia[] = delivery.media.map((item) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    previewUrl: item.previewKey ? getPreviewUrl(item.previewKey) : null,
    thumbUrl: item.thumbKey ? getPreviewUrl(item.thumbKey) : null,
  }));

  const showPurchaseRefresher = searchParams.purchase === "success" && !unlocked;
  const justUnlocked = searchParams.purchase === "success" && unlocked;
  const sessionDate = delivery.session.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const photoCount = delivery.media.filter((item) => item.kind === "PHOTO").length;
  const videoCount = delivery.media.filter((item) => item.kind === "VIDEO").length;
  const heroTitle = delivery.title ?? defaultGalleryTitle(delivery.clientName ?? "");

  // Identité Souvenir fixe sur toute la galerie client (couleur non personnalisable
  // par l'opérateur) — voir CLAUDE.md "Couleur de marque galerie fixe".
  const themeStyle = {
    "--accent": CLIENT_BRAND_COLOR,
    "--accent-tint": `color-mix(in srgb, ${CLIENT_BRAND_COLOR} 12%, white)`,
  } as React.CSSProperties;

  const emptyState = (
    <div
      className="flex aspect-square w-full items-center justify-center rounded-card"
      style={{ background: `linear-gradient(160deg, ${CLIENT_BRAND_COLOR}, ${CLIENT_BRAND_COLOR}99)` }}
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-card border border-border bg-gradient-to-br from-success-tint to-surface px-4 py-4 shadow-card">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-2xl shadow-card">
          🎉
        </span>
        <div>
          <p className="text-base font-semibold text-ink">C&apos;est débloqué !</p>
          <p className="text-sm text-ink-2">Toutes tes photos et vidéos, en HD, sans filigrane.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <a href={`/api/gallery/${delivery.token}/zip`} className={actionCardClass}>
          <ActionCardContent
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            label="Tout télécharger"
          />
        </a>
        {operator.googleReviewUrl ? (
          <ReviewLink token={delivery.token} href={operator.googleReviewUrl} className={actionCardClass}>
            <ActionCardContent
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              label="Laisser un avis"
            />
          </ReviewLink>
        ) : null}
      </div>
    </div>
  ) : (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="border-b border-border bg-accent-tint px-4 py-3">
        <p className="text-sm font-semibold text-ink">🎁 Avec le pack HD</p>
      </div>
      <ul className="flex flex-col gap-2.5 px-4 py-4 text-sm text-ink-2">
        <li className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-bold text-accent">
            ✓
          </span>
          Toutes les photos et vidéos en haute définition
        </li>
        <li className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-bold text-accent">
            ✓
          </span>
          Sans filigrane
        </li>
        <li className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-bold text-accent">
            ✓
          </span>
          Téléchargement en un clic (zip)
        </li>
      </ul>
    </div>
  );

  return (
    <main
      className={`relative min-h-screen bg-surface md:flex md:items-start ${!isMarketing && !unlocked ? "pb-24 md:pb-0" : "pb-10 md:pb-0"}`}
      style={themeStyle}
    >
      {/* Blobs décoratifs — fixed pour ne pas affecter la mise en page desktop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-32 right-0 h-[500px] w-[420px] rounded-full blur-[150px]"
          style={{ background: "#7DD3FC", opacity: 0.28 }}
        />
        <div
          className="absolute top-[38%] -left-24 h-[460px] w-[380px] rounded-full blur-[130px]"
          style={{ background: "#3B82F6", opacity: 0.15 }}
        />
        <div
          className="absolute bottom-32 right-0 h-[420px] w-[360px] rounded-full blur-[120px]"
          style={{ background: "#4F46E5", opacity: 0.12 }}
        />
      </div>

      {/* ===== PANNEAU GAUCHE : header + CTAs (sidebar sticky sur desktop) ===== */}
      <div className="relative z-[1] w-full md:sticky md:top-0 md:h-screen md:w-[420px] md:shrink-0 md:overflow-y-auto md:border-r md:border-border">
        {justUnlocked ? <UnlockCelebration id={delivery.id} /> : null}

        <GalleryHeader
          operator={{ name: operator.name, logoUrl: operator.logoUrl }}
          location={operator.location}
          sessionDate={sessionDate}
          heroTitle={heroTitle}
          photoCount={photoCount}
          videoCount={videoCount}
        />

        {/* Refresher achat en attente */}
        {showPurchaseRefresher ? (
          <div className="px-4 pt-4">
            <PurchaseSuccessRefresher />
          </div>
        ) : null}

        {/* Grille de médias — mobile uniquement (sur desktop, elle va dans le panneau droit) */}
        <div className="mt-4 px-4 md:hidden">
          {media.length > 0 ? (
            <MediaFeed media={media} token={delivery.token} locked={!unlocked} />
          ) : (
            emptyState
          )}
        </div>

        {/* CTAs + consentement + footer */}
        <div className="mt-5 px-4 pb-10">
          {statusCard}

          {isMarketing ? (
            <div className="mt-5">
              <MarketingCtas
                token={delivery.token}
                operator={{
                  name: operator.name,
                  googleReviewUrl: operator.googleReviewUrl,
                  instagramHandle: operator.instagramHandle,
                }}
                initialEmail={delivery.clientEmail}
              />
            </div>
          ) : null}

          {/* Bouton de paiement inline — desktop uniquement */}
          {!isMarketing && !unlocked ? (
            <div className="mt-5 hidden md:block">
              <CheckoutButton deliveryId={delivery.id} priceCents={operator.packPriceCents} inline />
            </div>
          ) : null}

          <div className="mt-5 rounded-card border border-border bg-canvas p-4">
            <ConsentToggle token={delivery.token} initialConsent={consentImage} />
          </div>

          <footer className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <LogoMark className="h-4 w-4 rounded-[4px]" />
              via Souvenir
            </span>
            <Link href={`/g/${delivery.token}/confidentialite`} className="underline">
              Confidentialité
            </Link>
          </footer>
        </div>
      </div>

      {/* ===== PANNEAU DROIT : grille de médias — desktop uniquement ===== */}
      <div className="relative z-[1] hidden flex-1 md:block md:min-h-screen md:bg-canvas">
        <div className="p-4 lg:p-6">
          {media.length > 0 ? (
            <MediaFeed
              media={media}
              token={delivery.token}
              locked={!unlocked}
              gridClassName="grid grid-cols-3 gap-1 lg:grid-cols-4"
            />
          ) : (
            <div className="mx-auto max-w-sm">{emptyState}</div>
          )}
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
