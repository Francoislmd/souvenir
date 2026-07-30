"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/app/g/s/[shareToken]/collective.module.css";
import { quote, type PricingConfig } from "@/lib/pricing";
import { formatEuros } from "@/lib/format";
import { PaymentSheet } from "@/components/gallery/PaymentSheet";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { Logo } from "@/components/brand/Logo";
import { SessionRetrieval } from "@/components/gallery/SessionRetrieval";
import type { GroupDaySummary, GroupPhoto, GroupSlotSummary } from "@/lib/gallery-group";

const ALL_LABEL = "Tout le créneau";

type View = "retrieval" | "gallery";

export function GroupGallery({
  shareToken,
  operatorName,
  logoUrl,
  days,
  pricing,
  packOnly,
}: {
  shareToken: string;
  operatorName: string;
  logoUrl: string | null;
  days: GroupDaySummary[];
  pricing: PricingConfig;
  packOnly: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("retrieval");
  const [dayLabel, setDayLabel] = useState("");
  const [activeSlot, setActiveSlot] = useState<GroupSlotSummary | null>(null);
  const [photos, setPhotos] = useState<GroupPhoto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cur, setCur] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkout, setCheckout] = useState<{ clientSecret: string; amountCents: number; label: string; token: string; participantId: string } | null>(null);

  const q = quote(selected.size, photos.length, pricing, ALL_LABEL);

  // Pack uniquement (Réglages) : pas de sélection à la carte, le client
  // achète tout le créneau — on la maintient toujours pleine.
  useEffect(() => {
    if (!packOnly) return;
    setSelected(new Set(photos.map((p) => p.id)));
  }, [packOnly, photos]);

  // Écrans 1 (jour) et 2 (créneau) — voir souvenir-handoff.md. Confirmé via
  // le CTA sticky de SessionRetrieval, qui gère seule sa navigation
  // (?date=, filtre, sélection) ; ici on ne fait qu'ouvrir la galerie.
  async function onSlotConfirmed(slot: GroupSlotSummary, confirmedDayLabel: string): Promise<void> {
    setActiveSlot(slot);
    setDayLabel(confirmedDayLabel);
    setSelected(new Set());
    setCur(0);
    setView("gallery");
    const res = await fetch(`/api/g/s/${shareToken}/slots/${slot.id}/photos`);
    if (res.ok) {
      const data = (await res.json()) as { photos: GroupPhoto[] };
      setPhotos(data.photos);
    }
  }

  // Les aperçus arrivent en tâche de fond si le worker n'a pas fini de tout
  // traiter au moment de l'ouverture — même principe que BoutiqueGallery.
  useEffect(() => {
    if (view !== "gallery" || !activeSlot) return;
    if (photos.length > 0 && photos.every((p) => p.previewUrl)) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/g/s/${shareToken}/slots/${activeSlot.id}/photos`);
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { photos: GroupPhoto[] };
      if (!cancelled) setPhotos(data.photos);
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [view, activeSlot, shareToken, photos]);

  function toSlots(): void {
    setView("retrieval");
    setActiveSlot(null);
    setPhotos([]);
    setSelected(new Set());
  }

  function goTo(i: number): void {
    setCur(i);
    const el = deckRef.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function tap(photoId: string): void {
    if (packOnly) return;
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function selectN(n: number): void {
    setSelected(new Set(photos.slice(0, n).map((p) => p.id)));
  }
  function selectAll(): void {
    setSelected(new Set(photos.map((p) => p.id)));
  }

  function onCheckoutReady(data: { clientSecret: string; amountCents: number; token: string; participantId: string }): void {
    setCheckoutOpen(false);
    setCheckout({ ...data, label: q.label || "Vos photos" });
  }

  async function onPaymentSuccess(): Promise<void> {
    if (!checkout) return;
    await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: checkout.participantId }),
    }).catch(() => undefined);
    router.push(`/g/${checkout.token}`);
  }

  if (view === "retrieval") {
    return <SessionRetrieval shareToken={shareToken} operatorName={operatorName} operatorLogoUrl={logoUrl} days={days} onConfirm={(slot, label) => void onSlotConfirmed(slot, label)} />;
  }

  if (!activeSlot) return null;

  return (
    <>
      <GalleryHeader operatorName={operatorName} logoUrl={logoUrl} dateLabel={`${activeSlot.activity} · ${activeSlot.label}`} />
      <div className={styles.slotbar}>
        <div>
          <div className={styles.hh}>{activeSlot.label}</div>
          <div className={styles.dd}>
            {dayLabel} · {activeSlot.activity}
            {activeSlot.guide ? ` · guide ${activeSlot.guide}` : ""}
          </div>
        </div>
        <span className={styles.sp} />
        <button type="button" onClick={toSlots}>
          Changer
        </button>
      </div>

      <div className={styles.cnt}>
        <span className={styles.c}>
          {photos.length} photo{photos.length > 1 ? "s" : ""} de ce créneau
        </span>
        <span className={styles.sp} />
        {!packOnly && selected.size > 0 ? (
          <button type="button" onClick={() => setSelected(new Set())}>
            Tout enlever
          </button>
        ) : null}
      </div>

      <div className={styles.deck} ref={deckRef}>
        {photos.map((photo, i) => {
          const on = selected.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`${styles.slide} ${on ? styles.on : ""}`}
              onClick={() => {
                setCur(i);
                tap(photo.id);
              }}
            >
              {photo.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.previewUrl} alt="" className={styles["slide-img"]} />
              ) : null}
              <span className={styles.grad} />
              <span className={styles.lock} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
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

      <div className={styles.film}>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className={`${styles.fr} ${selected.has(photo.id) ? styles.on : ""} ${i === cur ? styles.cur : ""}`}
            onClick={() => goTo(i)}
          >
            {photo.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.previewUrl} alt="" className={styles["fr-img"]} />
            ) : null}
          </button>
        ))}
      </div>

      <div className={styles.offers}>
        <div className={styles.lbl}>Votre formule</div>
        {!packOnly ? (
          <button type="button" className={`${styles.of} ${selected.size === 1 ? styles.on : ""}`} onClick={() => selectN(1)}>
            <span className={styles.rad}>
              <i />
            </span>
            <span className={styles.oi}>
              <span className={styles.ot}>À la photo</span>
              <span className={styles.oh}>celles que vous choisissez</span>
            </span>
            <span className={styles.pz}>{formatEuros(pricing.pricePhotoCents)}</span>
          </button>
        ) : null}
        <button
          type="button"
          className={`${styles.of} ${selected.size === photos.length && photos.length > 0 ? styles.on : ""}`}
          onClick={selectAll}
        >
          <span className={styles.best}>Le plus pris</span>
          <span className={styles.rad}>
            <i />
          </span>
          <span className={styles.oi}>
            <span className={styles.ot}>{ALL_LABEL}</span>
            <span className={styles.oh}>{photos.length} photos en haute définition</span>
          </span>
          <span className={styles.pz}>{formatEuros(pricing.priceAllCents)}</span>
        </button>

        {selected.size > 0 && selected.size < photos.length ? (
          <Nudge selectedCount={selected.size} paidTotal={photos.length} pricing={pricing} onSelectAll={selectAll} />
        ) : null}
      </div>

      <div className={styles.trust}>
        <TrustLine text="Téléchargement immédiat, pleine résolution, sans filigrane." />
        <TrustLine text="Paiement sécurisé. Aucun compte à créer." />
        <TrustLine text="Vous recevez vos photos par email, elles restent 90 jours." />
      </div>

      <div className={styles.privacy}>
        <div className={styles.t}>Une photo de vous que vous ne voulez pas ici ?</div>
        <div className={styles.d}>Demandez son retrait, sans justification.</div>
        <Link href={`/g/s/${shareToken}/retrait`}>Demander le retrait</Link>
      </div>
      <div className={styles.legal}>Photos conservées 90 jours puis supprimées automatiquement.</div>

      <div className={styles.poweredBy}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>

      <div className={`${styles.buybar} ${selected.size > 0 ? styles.on : ""}`}>
        <div className={styles["bb-l"]}>
          <span className={styles.n}>{q.label}</span>
          <span className={styles.sp} />
          {q.fullCents > q.totalCents ? <span className={styles.old}>{formatEuros(q.fullCents)}</span> : null}
          <span className={styles.tot}>{formatEuros(q.totalCents)}</span>
        </div>
        <button type="button" className={styles.pay} onClick={() => setCheckoutOpen(true)} disabled={selected.size === 0}>
          Récupérer mes photos
        </button>
      </div>

      {checkoutOpen ? (
        <EmailCheckoutSheet
          shareToken={shareToken}
          slotId={activeSlot.id}
          photoIds={Array.from(selected)}
          label={q.label}
          amountCents={q.totalCents}
          onReady={onCheckoutReady}
          onClose={() => setCheckoutOpen(false)}
        />
      ) : null}

      {checkout ? (
        <PaymentSheet
          clientSecret={checkout.clientSecret}
          amountCents={checkout.amountCents}
          label={checkout.label}
          onSuccess={onPaymentSuccess}
          onClose={() => setCheckout(null)}
        />
      ) : null}

      {lightbox !== null && photos[lightbox] ? (
        <div className={styles.box} onClick={() => setLightbox(null)}>
          <div className={styles.ph}>
            {photos[lightbox]!.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[lightbox]!.previewUrl!} alt="" />
            ) : null}
            <div className={styles.lock} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>
          </div>
          <button className={styles.cl} aria-label="Fermer">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : null}
    </>
  );
}

function TrustLine({ text }: { text: string }) {
  return (
    <div className={styles.tr}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {text}
    </div>
  );
}

function Nudge({
  selectedCount,
  paidTotal,
  pricing,
  onSelectAll,
}: {
  selectedCount: number;
  paidTotal: number;
  pricing: PricingConfig;
  onSelectAll: () => void;
}) {
  const q = quote(selectedCount, paidTotal, pricing, ALL_LABEL);

  if (q.totalCents >= pricing.priceAllCents) {
    return (
      <div className={styles.nudge}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: 1 }}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <div>
          <div className={styles.nt}>Prenez tout le créneau, c&rsquo;est moins cher</div>
          <div className={styles.nh}>
            Vos {selectedCount} photos coûtent {formatEuros(q.totalCents)}. Les {paidTotal} reviennent à {formatEuros(pricing.priceAllCents)}.
          </div>
          <button type="button" onClick={onSelectAll}>
            Tout prendre pour {formatEuros(pricing.priceAllCents)}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Feuille email → checkout. Distincte de PaymentSheet (Stripe Elements) :
 * il faut d'abord créer le Participant + PaymentIntent côté serveur, donc
 * capter l'email et valider avant de pouvoir monter PaymentSheet (qui exige
 * un clientSecret existant). Brief §3.3 : « c'est là que nous apprenons qui
 * vous êtes ».
 */
function EmailCheckoutSheet({
  shareToken,
  slotId,
  photoIds,
  label,
  amountCents,
  onReady,
  onClose,
}: {
  shareToken: string;
  slotId: string;
  photoIds: string[];
  label: string;
  amountCents: number;
  onReady: (data: { clientSecret: string; amountCents: number; token: string; participantId: string }) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErr(true);
      setError("Il nous faut votre email pour vous envoyer les photos.");
      return;
    }
    setErr(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/g/s/${shareToken}/slots/${slotId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, photoIds }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error === "stripe_not_ready" ? "Les paiements ne sont pas encore activés." : "Le paiement n'est pas disponible pour le moment.");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { clientSecret: string; amountCents: number; token: string; participantId: string };
      onReady(data);
    } catch {
      setError("Le réseau a coupé — réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.sheet}>
      <div className={styles.bd} onClick={onClose} />
      <div className={styles.pn}>
        <div className={styles.grab} />
        <h3>Paiement</h3>
        <div className={styles.sum}>
          <span>{label}</span>
          <b>{formatEuros(amountCents)}</b>
        </div>
        <div className={styles.fld}>
          <label htmlFor="groupEmail">Votre email</label>
          <input
            id="groupEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="julie@email.com"
            className={`${styles.inp} ${err ? styles.err : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
          />
          <div className={styles.why}>C&rsquo;est là que nous enverrons vos photos — nous ne savons pas encore qui vous êtes.</div>
        </div>
        {error ? <p className={styles.checkoutError}>{error}</p> : null}
        <button type="button" className={styles.pay} onClick={() => void submit()} disabled={loading}>
          {loading ? "…" : "Continuer"}
        </button>
        <div className={styles.fine}>Paiement traité de façon sécurisée.</div>
      </div>
    </div>
  );
}
