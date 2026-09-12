"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/gallery/gallery.module.css";
import { applyReducedOffer, type PricingConfig } from "@/lib/pricing";
import { PhotoPicker } from "@/components/gallery/PhotoPicker";
import { PaymentSheet } from "@/components/gallery/PaymentSheet";
import { DownloadIcon } from "@/components/gallery/icons";
import { Logo } from "@/components/brand/Logo";
import { Spinner, TileSpinner } from "@/components/ui/Spinner";

export interface BoutiquePhoto {
  id: string;
  previewUrl: string | null;
  originalUrl: string | null;
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
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [checkout, setCheckout] = useState<{ clientSecret: string; amountCents: number; label: string; photoIds: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // L'archive se fabrique photo par photo côté serveur : entre le clic et le
  // début du téléchargement, il peut s'écouler plusieurs secondes pendant
  // lesquelles rien ne bougeait à l'écran.
  const [zipping, setZipping] = useState(false);

  // Le pro peut envoyer avant que le traitement serveur ait fini — les photos
  // encore en cours n'ont pas d'aperçu à l'ouverture du lien.
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

  async function openCheckout(photoIds: string[]): Promise<void> {
    if (photoIds.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/g/${token}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "stripe_not_ready" ? "Les paiements ne sont pas encore activés." : "Le paiement n'est pas disponible pour le moment.");
        return;
      }
      const data = (await res.json()) as { clientSecret: string; amountCents: number };
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
    setCheckout(null);
    await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId }),
    });
    router.refresh();
  }

  /**
   * Le téléchargement groupé. La moulinette s'arrête quand le serveur répond
   * vraiment : la route repose un cookie portant le jeton envoyé, et le
   * navigateur affiche dès lors sa propre progression. Le garde-fou de 90
   * secondes évite une moulinette éternelle si la réponse n'arrive jamais.
   */
  function startZip(): void {
    const ticket = Math.random().toString(36).slice(2, 12);
    setZipping(true);
    window.location.href = `/api/g/${token}/zip?t=${ticket}`;

    const started = Date.now();
    const timer = setInterval(() => {
      const done = document.cookie.split("; ").some((c) => c === `zip-ready=${ticket}`);
      if (done || Date.now() - started > 90_000) {
        clearInterval(timer);
        setZipping(false);
        if (done) document.cookie = "zip-ready=; Path=/; Max-Age=0; SameSite=Lax";
      }
    }, 400);
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
            <button type="button" className={styles.cta} style={{ marginTop: 20 }} disabled={zipping} onClick={() => startZip()}>
              {zipping ? (
                <>
                  <Spinner size={17} tone="light" />
                  Préparation de l&rsquo;archive…
                </>
              ) : (
                <>
                  <DownloadIcon />
                  Tout télécharger
                </>
              )}
            </button>
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
                ) : (
                  <TileSpinner />
                )}
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
