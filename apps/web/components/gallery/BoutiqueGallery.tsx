"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/g/[token]/boutique.module.css";
import { quote, applyReducedOffer, type PricingConfig } from "@/lib/pricing";
import { formatEuros } from "@/lib/format";
import { PaymentSheet } from "@/components/gallery/PaymentSheet";
import { Logo } from "@/components/brand/Logo";

export interface BoutiquePhoto {
  id: string;
  previewUrl: string | null;
  originalUrl: string | null;
  isFreeSample: boolean;
  isVideo: boolean;
  /** false = previewUrl est l'aperçu net (blurKey pas encore généré côté serveur) —
   * le composant applique alors un flou CSS temporaire en repli. */
  previewIsBlurred: boolean;
}

export function BoutiqueGallery({
  token,
  participantId,
  clientFirstName,
  photos: initialPhotos,
  pricing,
  bought,
  purchasedIds,
  googleReviewUrl,
  reducedOfferActive,
}: {
  token: string;
  participantId: string;
  clientFirstName: string;
  photos: BoutiquePhoto[];
  pricing: PricingConfig;
  bought: boolean;
  purchasedIds: string[];
  googleReviewUrl: string | null;
  reducedOfferActive: boolean;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const purchasable = useMemo(() => photos.filter((p) => !p.isFreeSample), [photos]);

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

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cur, setCur] = useState(0);
  const [checkout, setCheckout] = useState<{ clientSecret: string; amountCents: number; label: string } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string): void {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  const q = quote(selected.size, purchasable.length, pricing);
  const totalCents = reducedOfferActive ? applyReducedOffer(q.totalCents) : q.totalCents;

  // Le flou/filigrane reste tant que l'achat n'est pas payé — la sélection
  // (avant paiement) ne doit jamais dévoiler la photo en clair.
  function isLocked(photo: BoutiquePhoto): boolean {
    return !photo.isFreeSample;
  }

  function toggle(photoId: string): void {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;
    if (photo.isFreeSample) {
      showToast("Celle-ci est déjà à vous");
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function selectN(n: number): void {
    const next = new Set<string>();
    for (const p of purchasable.slice(0, n)) next.add(p.id);
    setSelected(next);
  }

  function selectAll(): void {
    setSelected(new Set(purchasable.map((p) => p.id)));
  }

  function goTo(i: number): void {
    setCur(i);
    const el = deckRef.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  async function openSheet(): Promise<void> {
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, photoIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCheckoutError(data.error === "stripe_not_ready" ? "Les paiements ne sont pas encore activés." : "Le paiement n'est pas disponible pour le moment.");
        return;
      }
      const data = (await res.json()) as { clientSecret: string; amountCents: number };
      setCheckout({ clientSecret: data.clientSecret, amountCents: data.amountCents, label: q.label || "Vos photos" });
    } catch {
      setCheckoutError("Le réseau a coupé — réessayez.");
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

  if (bought) {
    const purchasedSet = new Set(purchasedIds);
    const visible = photos.filter((p) => p.isFreeSample || purchasedSet.has(p.id));
    return (
      <div className={styles.done}>
        <div className={styles.ring}>
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2>Elles sont à vous</h2>
        <p>
          {visible.length} photo{visible.length > 1 ? "s" : ""} en pleine résolution. Téléchargez-les depuis cette page.
        </p>
        <div className={styles.grid}>
          {visible.map((p) => (
            <div key={p.id} className={styles.cell}>
              {p.originalUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.originalUrl} alt="" className={styles["cell-img"]} />
              ) : null}
            </div>
          ))}
        </div>
        {googleReviewUrl ? (
          <div className={styles.rev}>
            <div className={styles.stars}>★★★★★</div>
            <h3>Vous avez aimé votre sortie ?</h3>
            <p>Un avis Google prend 30 secondes et aide énormément une petite structure.</p>
            <a href={googleReviewUrl} target="_blank" rel="noreferrer">
              Laisser un avis
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className={styles.hi}>
        <h1>{clientFirstName}, vos photos sont là</h1>
        <p>
          {photos.length - purchasable.length > 0 ? <b>{photos.length - purchasable.length} offertes</b> : null}
          {photos.length - purchasable.length > 0 ? " · " : ""}
          {purchasable.length} à débloquer
        </p>
      </div>

      {selected.size > 0 ? (
        <div className={styles.count}>
          <span className={styles.c}>
            {selected.size} photo{selected.size > 1 ? "s" : ""} choisie{selected.size > 1 ? "s" : ""}
          </span>
          <span className={styles.sp} />
          <button className={styles.clr} onClick={() => setSelected(new Set())}>
            Tout enlever
          </button>
        </div>
      ) : null}

      <div className={styles.deck} ref={deckRef}>
        {photos.map((photo, i) => {
          const locked = isLocked(photo);
          const on = selected.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`${styles.slide} ${locked ? styles.lock : ""} ${locked && !photo.previewIsBlurred ? styles["lock-fallback"] : ""} ${on ? styles.on : ""}`}
              onClick={() => {
                setCur(i);
                toggle(photo.id);
              }}
            >
              {photo.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.previewUrl} alt="" className={styles["slide-img"]} />
              ) : null}
              {locked ? (
                <span className={styles.wm}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" />
                  </svg>
                </span>
              ) : null}
              {photo.isFreeSample ? <span className={styles.tag}>Offerte</span> : null}
              <span className={styles.grad} />
              <span className={styles.num}>
                {i + 1} / {photos.length}
              </span>
              <span className={styles.chosen}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Choisie
              </span>
              <button
                type="button"
                aria-label="Agrandir"
                className={styles.zoom}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(i);
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round">
                  <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <WantButton photo={photos[cur]} selected={photos[cur] ? selected.has(photos[cur].id) : false} pricePhotoCents={pricing.pricePhotoCents} onToggle={() => photos[cur] && toggle(photos[cur].id)} />

      <div className={styles.film}>
        {photos.map((photo, i) => {
          const locked = isLocked(photo);
          const on = selected.has(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              className={`${styles.fr} ${locked ? styles.lock : ""} ${locked && !photo.previewIsBlurred ? styles["lock-fallback"] : ""} ${on ? styles.on : ""} ${i === cur ? styles.cur : ""}`}
              onClick={() => goTo(i)}
            >
              {photo.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.previewUrl} alt="" className={styles["fr-img"]} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className={styles.offers}>
        <div className={styles.lbl}>Votre formule</div>
        <OfferRow
          active={selected.size === 1}
          title="À la photo"
          hint="Vous ne prenez que celles que vous aimez"
          price={pricing.pricePhotoCents}
          unit="la photo"
          onClick={() => selectN(1)}
        />
        <OfferRow
          active={selected.size === pricing.packSize}
          best
          title={`Pack ${pricing.packSize} photos`}
          hint="Le choix de la plupart"
          price={pricing.pricePackCents}
          unit={`${formatEuros(Math.round(pricing.pricePackCents / pricing.packSize))} la photo`}
          onClick={() => selectN(pricing.packSize)}
        />
        <OfferRow
          active={selected.size === purchasable.length && purchasable.length > 0}
          title="Toutes vos photos"
          hint={`${purchasable.length} photos`}
          price={pricing.priceAllCents}
          unit={purchasable.length > 0 ? `${formatEuros(Math.round(pricing.priceAllCents / purchasable.length))} la photo` : ""}
          onClick={selectAll}
        />

        <Nudge selectedCount={selected.size} paidTotal={purchasable.length} pricing={pricing} onSelectAll={selectAll} onSelectPack={() => selectN(pricing.packSize)} />
      </div>

      {googleReviewUrl ? (
        <div className={styles.free}>
          <div className={styles.ic}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E8460C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 17.8 6.2 21l1.1-6.5L2.6 9.9l6.5-.9L12 3l2.9 6 6.5.9-4.7 4.6 1.1 6.5z" />
            </svg>
          </div>
          <div>
            <div className={styles.ft}>Un avis Google, ça compte énormément</div>
            <div className={styles.fh}>Aidez cette petite structure — 30 secondes, ça change beaucoup pour elle.</div>
            <a href={googleReviewUrl} target="_blank" rel="noreferrer">
              Laisser un avis →
            </a>
          </div>
        </div>
      ) : null}

      <div className={styles.trust}>
        <TrustLine text="Téléchargement immédiat, en pleine résolution, sans filigrane." />
        <TrustLine text="Paiement sécurisé. Aucun compte à créer." />
        <TrustLine text="Votre lien reste actif 90 jours." />
      </div>

      <div className={styles.legal}>
        Vos photos sont conservées 90 jours puis supprimées automatiquement. Vous pouvez demander leur suppression
        immédiate à tout moment — <a href={`/g/${token}/supprimer`}>supprimer mes photos</a>.
      </div>

      <div className={styles.poweredBy}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>

      {checkoutError ? <p style={{ margin: "12px 20px 0", fontSize: ".85rem", color: "#dc2626" }}>{checkoutError}</p> : null}

      <div className={`${styles.buybar} ${selected.size > 0 ? styles.on : ""}`}>
        <div className={styles["bb-l"]}>
          <span className={styles.n}>{q.label}</span>
          <span className={styles.sp} />
          {q.fullCents > totalCents ? <span className={styles.old}>{formatEuros(q.fullCents)}</span> : null}
          <span className={styles.tot}>{formatEuros(totalCents)}</span>
        </div>
        <button type="button" className={styles.pay} onClick={openSheet} disabled={selected.size === 0}>
          Récupérer mes photos
        </button>
      </div>

      {checkout ? (
        <PaymentSheet
          clientSecret={checkout.clientSecret}
          amountCents={checkout.amountCents}
          label={checkout.label}
          onSuccess={onPaymentSuccess}
          onClose={() => setCheckout(null)}
        />
      ) : null}

      {lightbox !== null ? (
        <div className={styles.box} onClick={() => setLightbox(null)}>
          <div className={styles["box-ph"]}>
            {photos[lightbox]?.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[lightbox]!.previewUrl!}
                alt=""
                className={styles["box-img"]}
                style={isLocked(photos[lightbox]!) && !photos[lightbox]!.previewIsBlurred ? { filter: "blur(6px)" } : undefined}
              />
            ) : null}
          </div>
          <button className={styles.cl} aria-label="Fermer">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className={styles.hint}>Touchez pour fermer</div>
        </div>
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.on : ""}`}>{toast}</div>
    </>
  );
}

function WantButton({
  photo,
  selected,
  pricePhotoCents,
  onToggle,
}: {
  photo: BoutiquePhoto | undefined;
  selected: boolean;
  pricePhotoCents: number;
  onToggle: () => void;
}) {
  if (!photo) return null;
  if (photo.isFreeSample) {
    return (
      <button type="button" className={`${styles.want} ${styles.free}`}>
        Celle-ci est déjà à vous
      </button>
    );
  }
  if (selected) {
    return (
      <button type="button" className={`${styles.want} ${styles.picked}`} onClick={onToggle}>
        Choisie · appuyez pour retirer
      </button>
    );
  }
  return (
    <button type="button" className={styles.want} onClick={onToggle}>
      Je veux celle-là · {formatEuros(pricePhotoCents)}
    </button>
  );
}

function OfferRow({
  active,
  best,
  title,
  hint,
  price,
  unit,
  onClick,
}: {
  active: boolean;
  best?: boolean;
  title: string;
  hint: string;
  price: number;
  unit: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`${styles.of} ${active ? styles.on : ""}`} onClick={onClick}>
      {best ? <span className={styles.best}>Le plus pris</span> : null}
      <span className={styles.rad}>
        <i />
      </span>
      <span className={styles.oi}>
        <span className={styles.ot}>{title}</span>
        <span className={styles.oh}>{hint}</span>
      </span>
      <span className={styles.opz}>
        <span className={styles.pz}>{formatEuros(price)}</span>
        <span className={styles.unit}>{unit}</span>
      </span>
    </button>
  );
}

function Nudge({
  selectedCount,
  paidTotal,
  pricing,
  onSelectAll,
  onSelectPack,
}: {
  selectedCount: number;
  paidTotal: number;
  pricing: PricingConfig;
  onSelectAll: () => void;
  onSelectPack: () => void;
}) {
  if (selectedCount === 0 || selectedCount >= paidTotal) return null;
  const q = quote(selectedCount, paidTotal, pricing);

  if (q.totalCents >= pricing.priceAllCents) {
    return (
      <div className={styles.nudge}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: 1 }}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <div>
          <div className={styles.nt}>Prenez tout, c&rsquo;est moins cher</div>
          <div className={styles.nh}>
            Vos {selectedCount} photos coûtent {formatEuros(q.totalCents)}. Toutes reviennent à {formatEuros(pricing.priceAllCents)}.
          </div>
          <button onClick={onSelectAll}>Tout prendre pour {formatEuros(pricing.priceAllCents)}</button>
        </div>
      </div>
    );
  }

  if (selectedCount < pricing.packSize) {
    const miss = pricing.packSize - selectedCount;
    return (
      <div className={styles.nudge}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: 1 }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
        <div>
          <div className={styles.nt}>
            Encore {miss} photo{miss > 1 ? "s" : ""} et vous passez au pack
          </div>
          <div className={styles.nh}>
            {pricing.packSize} photos pour {formatEuros(pricing.pricePackCents)} au lieu de {formatEuros(pricing.packSize * pricing.pricePhotoCents)}.
          </div>
          <button onClick={onSelectPack}>Passer au pack</button>
        </div>
      </div>
    );
  }

  return null;
}

function TrustLine({ text }: { text: string }) {
  return (
    <div className={styles.tr}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {text}
    </div>
  );
}
