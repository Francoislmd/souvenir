"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/gallery/gallery.module.css";
import { applyReducedOffer, type PricingConfig } from "@/lib/pricing";
import { PhotoPicker } from "@/components/gallery/PhotoPicker";
import { PaymentSheet } from "@/components/gallery/PaymentSheet";
import { DownloadIcon } from "@/components/gallery/icons";
import { Logo } from "@/components/brand/Logo";
import {
  gtmEvent,
  trackAddPaymentInfo,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackRemoveFromCart,
  trackViewItemList,
  toEuros,
  type GtmItem,
} from "@/lib/gtm";

export interface BoutiquePhoto {
  id: string;
  previewUrl: string | null;
  originalUrl: string | null;
  isVideo: boolean;
}

/**
 * La galerie d'un participant : ses photos, un prix, un bouton.
 *
 * Ce client verra cette page une fois, deux minutes, sur son téléphone,
 * mouillé, sur un parking, ses amis qui attendent. Il se pose trois
 * questions et pas une de plus : est-ce que ce sont mes photos ? combien ?
 * comment je les récupère ? La version précédente lui proposait en plus un
 * carrousel, une pellicule sous le carrousel, un bouton « je veux
 * celle-ci », un choix de formule et une relance — cinq endroits pour la
 * même décision.
 */
export function BoutiqueGallery({
  token,
  participantId,
  title,
  when,
  photos: initialPhotos,
  pricing,
  packOnly,
  bought,
  purchasedIds,
  googleReviewUrl,
  reducedOfferActive,
  operatorId,
  sortieId,
}: {
  token: string;
  participantId: string;
  /** « Rafting, Basse Ardèche » — l'activité et le lieu. */
  title: string;
  /** « Samedi 5 septembre, 9 h 30 ». */
  when: string;
  photos: BoutiquePhoto[];
  pricing: PricingConfig;
  packOnly: boolean;
  bought: boolean;
  purchasedIds: string[];
  googleReviewUrl: string | null;
  reducedOfferActive: boolean;
  /** Uniquement pour la mesure — permet de segmenter GA4 par prestataire/sortie. */
  operatorId: string;
  sortieId: string;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [checkout, setCheckout] = useState<{ clientSecret: string; amountCents: number; label: string; photoIds: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* ── Mesure e-commerce (GA4 via GTM) ──────────────────────────────
     La galerie EST la boutique : chaque photo est un article, la sélection
     est le panier. On colle donc au modèle e-commerce standard plutôt que
     d'inventer des événements maison — ça débloque les rapports
     « Monétisation » de GA4 sans configuration supplémentaire. */
  const gtmContext = useMemo(
    () => ({ operator_id: operatorId, sortie_id: sortieId, participant_id: participantId }),
    [operatorId, sortieId, participantId],
  );

  const toItems = useCallback(
    (list: BoutiquePhoto[]): GtmItem[] =>
      list.map((p, i) => ({
        item_id: p.id,
        item_name: p.isVideo ? "Vidéo de sortie" : "Photo de sortie",
        item_category: p.isVideo ? "video" : "photo",
        // Le prix unitaire ne dépend pas de la photo : c'est le tarif du pro.
        price: toEuros(pricing.pricePhotoCents),
        quantity: 1,
        index: i,
      })),
    [pricing.pricePhotoCents],
  );

  const itemsFor = useCallback(
    (ids: Iterable<string>): GtmItem[] => {
      const wanted = new Set(ids);
      return toItems(photos.filter((p) => wanted.has(p.id)));
    },
    [photos, toItems],
  );

  const listSent = useRef(false);
  useEffect(() => {
    if (listSent.current || photos.length === 0) return;
    listSent.current = true;

    gtmEvent("gallery_open", {
      ...gtmContext,
      photos_total: photos.length,
      pack_only: packOnly,
      reduced_offer: reducedOfferActive,
      already_bought: bought,
    });

    if (!bought) {
      trackViewItemList({
        items: toItems(photos),
        listId: "gallery_participant",
        listName: "Galerie participant",
        extra: gtmContext,
      });
    }
    // Volontairement au premier rendu utile uniquement : le polling qui
    // complète les aperçus ne doit pas renvoyer une impression de liste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  // Le pro peut envoyer avant que le worker ait fini de traiter toutes les
  // photos — celles encore en cours n'ont pas d'aperçu à l'ouverture du lien.
  // On les complète discrètement en arrière-plan, sans recharger la page.
  useEffect(() => {
    if (bought) return;
    if (photos.every((p) => p.previewUrl)) return;
    let cancelled = false;

    async function fillMissing(): Promise<void> {
      const res = await fetch(`/api/g/${token}/photos`);
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { photos: BoutiquePhoto[] };
      const freshById = new Map(data.photos.map((p) => [p.id, p]));
      setPhotos((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (p.previewUrl) return p;
          const match = freshById.get(p.id);
          if (!match?.previewUrl) return p;
          changed = true;
          return match;
        });
        // De nouvelles photos peuvent aussi être arrivées après l'ouverture.
        const knownIds = new Set(prev.map((p) => p.id));
        const added = data.photos.filter((p) => !knownIds.has(p.id));
        if (added.length > 0) changed = true;
        return changed ? [...next, ...added] : prev;
      });
    }

    const interval = setInterval(() => void fillMissing(), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, bought, photos]);

  function trackSelection(added: string[], removed: string[], source: string): void {
    if (added.length > 0) {
      trackAddToCart({ items: itemsFor(added), valueCents: added.length * pricing.pricePhotoCents, extra: { ...gtmContext, selection_source: source } });
    }
    if (removed.length > 0) {
      trackRemoveFromCart({ items: itemsFor(removed), valueCents: removed.length * pricing.pricePhotoCents, extra: { ...gtmContext, selection_source: source } });
    }
  }

  async function openCheckout(photoIds: string[]): Promise<void> {
    if (photoIds.length === 0) return;
    setError(null);
    setBusy(true);
    trackBeginCheckout({
      items: itemsFor(photoIds),
      valueCents: 0,
      extra: { ...gtmContext, photos_selected: photoIds.length, reduced_offer: reducedOfferActive },
    });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, photoIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "stripe_not_ready" ? "Les paiements ne sont pas encore activés." : "Le paiement n'est pas disponible pour le moment.");
        return;
      }
      const data = (await res.json()) as { clientSecret: string; amountCents: number };
      // Le PaymentIntent est créé et la feuille Stripe s'ouvre : à ce stade le
      // client a bien atteint le formulaire de paiement.
      trackAddPaymentInfo({ items: itemsFor(photoIds), valueCents: data.amountCents, paymentType: "stripe", extra: gtmContext });
      setCheckout({
        clientSecret: data.clientSecret,
        amountCents: data.amountCents,
        label: photoIds.length >= photos.length ? allLabel(photos.length) : `${photoIds.length} photo${photoIds.length > 1 ? "s" : ""}`,
        photoIds,
      });
    } catch {
      setError("Le réseau a coupé — réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function onPaymentSuccess(): Promise<void> {
    // transaction_id = participantId : un participant n'a qu'une commande, ce
    // qui donne à GA4 une clé de déduplication stable même si la page est
    // rechargée ou l'événement rejoué.
    trackPurchase({
      transactionId: participantId,
      items: itemsFor(checkout?.photoIds ?? []),
      valueCents: checkout?.amountCents ?? 0,
      extra: { ...gtmContext, photos_purchased: checkout?.photoIds.length ?? 0, reduced_offer: reducedOfferActive, pack_only: packOnly },
    });

    setCheckout(null);
    await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId }),
    });
    router.refresh();
  }

  if (bought) {
    const purchasedSet = new Set(purchasedIds);
    const yours = photos.filter((p) => purchasedSet.has(p.id));
    return (
      <>
        <div className={styles.done}>
          <div className={styles.doneHead}>
            <span className={styles.ok} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <div className={styles.doneText}>
              <h1>C&rsquo;est à vous</h1>
              <p className={styles.sub}>
                {title}, {when.toLowerCase()}
              </p>
              <p className={styles.hint}>
                {yours.length} photo{yours.length > 1 ? "s" : ""} en pleine résolution, sans filigrane.
              </p>
            </div>
            {/* La promesse de l'écran, enfin tenue : un seul geste. Avant, la
                page écrivait trois fois « téléchargement immédiat » et
                n'offrait aucun téléchargement — il fallait appuyer longuement
                sur chaque photo, une par une. */}
            <a className={styles.cta} href={`/api/g/${token}/zip`} style={{ marginTop: 20 }}>
              <DownloadIcon />
              Tout télécharger
            </a>
          </div>

          <div className={styles.doneGrid}>
            {yours.map((p) => (
              <span key={p.id} className={styles.doneTile}>
                {p.originalUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.originalUrl} alt="" />
                    <a className={styles.save} href={`${p.originalUrl}&download=`} aria-label="Télécharger cette photo">
                      <DownloadIcon size={15} />
                    </a>
                  </>
                ) : null}
              </span>
            ))}
          </div>

          {googleReviewUrl ? (
            <div className={styles.card}>
              <span className={styles.cardText}>
                <span className={styles.cardT}>Vous avez aimé votre sortie ?</span>
                <span className={styles.cardD}>Un avis Google prend trente secondes et change beaucoup pour une petite structure.</span>
              </span>
              <a
                className={styles.quiet}
                href={googleReviewUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => gtmEvent("review_click", { ...gtmContext, platform: "google" })}
              >
                Laisser un avis
              </a>
            </div>
          ) : null}
        </div>

        <p className={styles.legal}>
          Vos photos restent disponibles 90 jours, puis sont supprimées. <a href={`/g/${token}/supprimer`}>Les supprimer maintenant</a>.
        </p>
        <div className={styles.powered}>
          Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <h1>{title}</h1>
        <p className={styles.sub}>{when}</p>
        <p className={styles.hint}>{packOnly ? "Toutes vos photos, en une fois." : "Touchez celles que vous voulez, ou prenez tout."}</p>
      </div>

      <PhotoPicker
        photos={photos}
        pricing={pricing}
        packOnly={packOnly}
        allLabel={allLabel}
        unitSuffix="l'unité"
        error={error}
        busy={busy}
        discount={reducedOfferActive ? applyReducedOffer : undefined}
        onCheckout={(ids) => void openCheckout(ids)}
        onSelectionChange={trackSelection}
      />

      <p className={styles.legal}>
        Vos photos sont conservées 90 jours puis supprimées automatiquement. Vous pouvez demander leur suppression immédiate à tout moment —{" "}
        <a href={`/g/${token}/supprimer`}>supprimer mes photos</a>.
      </p>
      <div className={styles.powered}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>
      {/* Réserve de place sous la barre d'achat, qui flotte au-dessus de la
          page : elle doit suivre les mentions, sinon elles passent dessous. */}
      <div className={styles.pad} />

      {checkout ? (
        <PaymentSheet
          clientSecret={checkout.clientSecret}
          amountCents={checkout.amountCents}
          label={checkout.label}
          onSuccess={onPaymentSuccess}
          onClose={() => setCheckout(null)}
        />
      ) : null}
    </>
  );
}

function allLabel(count: number): string {
  return count === 1 ? "Votre photo" : `Les ${count} photos`;
}
