"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/components/gallery/gallery.module.css";
import { quote, type PricingConfig } from "@/lib/pricing";
import { formatEuros } from "@/lib/format";
import { PhotoPicker } from "@/components/gallery/PhotoPicker";
import { PaymentSheet } from "@/components/gallery/PaymentSheet";
import { SessionRetrieval } from "@/components/gallery/SessionRetrieval";
import { LockIcon } from "@/components/gallery/icons";
import { Logo } from "@/components/brand/Logo";
import type { GroupDaySummary, GroupPhoto, GroupSlotSummary } from "@/lib/gallery-group";

/**
 * Le lien de groupe : un QR code affiché à la base, scanné au retour. Deux
 * écrans seulement — choisir son créneau, puis choisir ses photos. Le second
 * est exactement celui de la boutique individuelle (PhotoPicker) : le client
 * n'a aucune raison de voir deux interfaces différentes pour le même geste.
 */
export function GroupGallery({
  shareToken,
  days,
  pricing,
  packOnly,
}: {
  shareToken: string;
  days: GroupDaySummary[];
  pricing: PricingConfig;
  packOnly: boolean;
}) {
  const router = useRouter();
  const [slot, setSlot] = useState<GroupSlotSummary | null>(null);
  const [dayLabel, setDayLabel] = useState("");
  const [photos, setPhotos] = useState<GroupPhoto[]>([]);
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);
  const [checkout, setCheckout] = useState<{ clientSecret: string; amountCents: number; label: string; token: string; participantId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(id: string): Promise<void> {
    const res = await fetch(`/api/g/s/${shareToken}/slots/${id}/photos`);
    if (!res.ok) return;
    const data = (await res.json()) as { photos: GroupPhoto[] };
    setPhotos(data.photos);
  }

  function pick(picked: GroupSlotSummary, label: string): void {
    setSlot(picked);
    setDayLabel(label);
    setPhotos([]);
    void load(picked.id);
  }

  // Les aperçus arrivent en tâche de fond si le worker n'a pas fini de tout
  // traiter au moment de l'ouverture — même principe que la boutique.
  useEffect(() => {
    if (!slot) return;
    if (photos.length > 0 && photos.every((p) => p.previewUrl)) return;
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) void load(slot.id);
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, photos]);

  async function onPaymentSuccess(): Promise<void> {
    if (!checkout) return;
    await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: checkout.participantId }),
    }).catch(() => undefined);
    router.push(`/g/${checkout.token}`);
  }

  if (!slot) {
    return (
      <>
        <SessionRetrieval shareToken={shareToken} days={days} onPick={pick} />
        <div className={styles.legal}>
          Une photo de vous que vous ne voulez pas ici ? <Link href={`/g/s/${shareToken}/retrait`}>Demandez son retrait</Link>, sans justification.
        </div>
        <div className={styles.powered}>
          Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
        </div>
      </>
    );
  }

  const q = quote(pendingIds?.length ?? 0, photos.length, pricing, allLabel(photos.length));

  return (
    <>
      <div className={styles.head}>
        <h1>{slot.activity}</h1>
        <p className={styles.sub}>
          {dayLabel ? `${dayLabel.replace(/^./, (c) => c.toUpperCase())}, ` : ""}
          {slot.rangeLabel.toLowerCase()}
        </p>
        <p className={styles.hint}>
          {packOnly ? "Toutes les photos du créneau, en une fois." : "Touchez celles où vous êtes, ou prenez tout."}{" "}
          <button type="button" className={styles.moreBtn} onClick={() => setSlot(null)}>
            Changer de créneau
          </button>
        </p>
      </div>

      <PhotoPicker
        photos={photos}
        pricing={pricing}
        packOnly={packOnly}
        allLabel={allLabel}
        unitSuffix="l'unité"
        error={error}
        busy={false}
        onCheckout={(ids) => {
          setError(null);
          setPendingIds(ids);
        }}
      />

      <div className={styles.legal}>
        Photos conservées 90 jours puis supprimées automatiquement. Une photo de vous que vous ne voulez pas ici ?{" "}
        <Link href={`/g/s/${shareToken}/retrait`}>Demandez son retrait</Link>, sans justification.
      </div>
      <div className={styles.powered}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>

      {pendingIds ? (
        <EmailSheet
          shareToken={shareToken}
          slotId={slot.id}
          photoIds={pendingIds}
          label={pendingIds.length >= photos.length ? allLabel(photos.length) : `${pendingIds.length} photo${pendingIds.length > 1 ? "s" : ""}`}
          amountCents={q.totalCents}
          onReady={(data) => {
            setPendingIds(null);
            setCheckout({ ...data, label: pendingIds.length >= photos.length ? allLabel(photos.length) : `${pendingIds.length} photo${pendingIds.length > 1 ? "s" : ""}` });
          }}
          onClose={() => setPendingIds(null)}
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
    </>
  );
}

function allLabel(count: number): string {
  return count === 1 ? "La photo du créneau" : `Les ${count} photos`;
}

/**
 * L'email, puis le paiement. Deux feuilles et pas une, parce qu'il faut
 * créer le Participant et le PaymentIntent côté serveur avant de pouvoir
 * monter Stripe Elements, qui exige un clientSecret existant. C'est aussi
 * le seul moment du parcours de groupe où l'on apprend qui est le client
 * (brief §3.3) — et c'est là qu'on le lui dit.
 */
function EmailSheet({
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
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setInvalid(true);
      setError("Il nous faut votre email pour vous envoyer les photos.");
      return;
    }
    setInvalid(false);
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
        <span className={styles.grab} />
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
            className={`${styles.inp} ${invalid ? styles.inpErr : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
          />
          <div className={styles.why}>C&rsquo;est là que nous enverrons vos photos — nous ne savons pas encore qui vous êtes.</div>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="button" className={styles.cta} onClick={() => void submit()} disabled={loading}>
          {loading ? "Un instant…" : "Continuer"}
        </button>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Annuler
        </button>
        <div className={styles.fine}>
          <LockIcon />
          Paiement sécurisé par Stripe · aucun compte à créer
        </div>
      </div>
    </div>
  );
}
