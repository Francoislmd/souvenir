"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/components/gallery/gallery.module.css";
import { quote, type PricingConfig } from "@/lib/pricing";
import { formatEuros } from "@/lib/format";
import { PhotoPicker } from "@/components/gallery/PhotoPicker";
import { PaymentSheet } from "@/components/gallery/PaymentSheet";
import { SessionRetrieval } from "@/components/gallery/SessionRetrieval";
import { BackLink } from "@/components/gallery/BackLink";
import { LockIcon } from "@/components/gallery/icons";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/brand/Logo";
import type { GroupDaySummary, GroupPhoto, GroupSlotSummary } from "@/lib/gallery-group";

/**
 * La boutique d'un opérateur : un QR code affiché à la base, scanné au
 * retour. Trois écrans — le jour, l'heure de départ, les photos — dont le
 * dernier est exactement celui de la boutique individuelle (PhotoPicker) :
 * le client n'a aucune raison de voir deux interfaces différentes pour le
 * même geste.
 *
 * **L'URL désigne l'écran** : `?j={jour}` pour les heures de départ d'un
 * jour, `?j={jour}&c={créneau}` pour une galerie. Sans ça, tout vivait dans
 * l'état React : impossible de partager le lien de sa galerie, de le mettre
 * en favori, et le bouton « précédent » du navigateur sortait de la
 * boutique au lieu de remonter d'un écran.
 *
 * Le jour et le créneau sont donc lus de l'URL au premier rendu (le serveur
 * les passe en props, après les avoir vérifiés), écrits avec
 * `history.pushState` à chaque choix — pas de `router.push`, qui rejouerait
 * la page côté serveur à chaque toucher — et relus sur `popstate`, ce qui
 * rend les flèches du navigateur équivalentes au « Retour ».
 *
 * `basePath` est le chemin tel que le navigateur le voit (il diffère selon
 * qu'on est sur store.linktrip.co ou sur le domaine principal, cf.
 * lib/store.ts) ; `apiBase` est identique partout, /api n'étant jamais
 * réécrit.
 */
export function GroupGallery({
  basePath,
  apiBase,
  appUrl,
  days,
  initialDateKey,
  initialSlot,
  initialDayLabel,
  pricing,
  packOnly,
}: {
  basePath: string;
  apiBase: string;
  appUrl: string;
  days: GroupDaySummary[];
  initialDateKey?: string;
  initialSlot?: GroupSlotSummary;
  initialDayLabel?: string;
  pricing: PricingConfig;
  packOnly: boolean;
}) {
  // Un seul jour publié : l'écran du jour n'aurait qu'une ligne à offrir, on
  // ouvre directement ses heures de départ. C'est aussi ce vers quoi le
  // « Retour » doit revenir si le navigateur remonte à une URL sans jour.
  const soleDay = days.length === 1 ? days[0]!.dateKey : "";

  const [dateKey, setDateKey] = useState(initialDateKey || soleDay);
  const [slotId, setSlotId] = useState(initialSlot?.id ?? "");
  const [slots, setSlots] = useState<GroupSlotSummary[]>([]);
  const [slotsState, setSlotsState] = useState<"loading" | "ready" | "error">("loading");
  const [photos, setPhotos] = useState<GroupPhoto[]>([]);
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);
  const [checkout, setCheckout] = useState<{ clientSecret: string; amountCents: number; label: string; token: string; participantId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Le premier chargement d'un créneau seulement : les rafraîchissements de
  // fond ne doivent pas faire disparaître une grille déjà affichée.
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Le créneau ouvert. Il vient de la liste du jour dès qu'elle est chargée ;
  // `initialSlot` ne sert qu'au tout premier rendu d'un lien ouvert
  // directement, avant que cette liste n'arrive.
  const slot = slots.find((s) => s.id === slotId) ?? (initialSlot && initialSlot.id === slotId ? initialSlot : null);
  const dayLabel = days.find((d) => d.dateKey === dateKey)?.dateLabel ?? initialDayLabel ?? "";

  const go = useCallback(
    (nextDateKey: string, nextSlotId: string, mode: "push" | "replace" = "push") => {
      setDateKey(nextDateKey);
      setSlotId(nextSlotId);
      const params = new URLSearchParams();
      if (nextDateKey) params.set("j", nextDateKey);
      if (nextSlotId) params.set("c", nextSlotId);
      const qs = params.toString();
      const url = qs ? `${basePath}?${qs}` : basePath;
      if (mode === "replace") window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
      window.scrollTo({ top: 0 });
    },
    [basePath],
  );

  // Les flèches du navigateur font exactement ce que fait le « Retour ».
  useEffect(() => {
    function onPop(): void {
      const params = new URLSearchParams(window.location.search);
      setDateKey(params.get("j") ?? soleDay);
      setSlotId(params.get("c") ?? "");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [soleDay]);

  // Les créneaux du jour affiché.
  useEffect(() => {
    if (!dateKey) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsState("loading");
    fetch(`${apiBase}/days/${encodeURIComponent(dateKey)}/slots`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json() as Promise<{ dateLabel: string; slots: GroupSlotSummary[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots);
        setSlotsState("ready");
      })
      .catch(() => {
        if (!cancelled) setSlotsState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey, apiBase]);

  const load = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`${apiBase}/slots/${id}/photos`);
      if (!res.ok) return;
      const data = (await res.json()) as { photos: GroupPhoto[] };
      setPhotos(data.photos);
    },
    [apiBase],
  );

  // Les photos du créneau ouvert.
  useEffect(() => {
    setPendingIds(null);
    setError(null);
    if (!slotId) {
      setPhotos([]);
      return;
    }
    let cancelled = false;
    setPhotos([]);
    setLoadingPhotos(true);
    void load(slotId).finally(() => {
      if (!cancelled) setLoadingPhotos(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slotId, load]);

  // Un identifiant de créneau qui ne correspond à rien dans le jour affiché :
  // lien périmé, ou sortie purgée depuis. On remonte à la liste des heures
  // sans laisser d'entrée dans l'historique — sinon le « précédent » y
  // retomberait aussitôt.
  useEffect(() => {
    if (slotId && !slot && slotsState !== "loading") go(dateKey, "", "replace");
  }, [slotId, slot, slotsState, dateKey, go]);

  // Les aperçus arrivent en tâche de fond si tout n'a pas été traité au
  // moment de l'ouverture — même principe que la boutique individuelle.
  useEffect(() => {
    if (!slotId) return;
    if (photos.length > 0 && photos.every((p) => p.previewUrl)) return;
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) void load(slotId);
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slotId, photos, load]);

  async function onPaymentSuccess(): Promise<void> {
    if (!checkout) return;
    await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: checkout.participantId }),
    }).catch(() => undefined);
    // La galerie personnelle vit sur le domaine principal, pas sur
    // store.linktrip.co : une navigation Next relative y enverrait le client
    // sur store.linktrip.co/g/... que le middleware prendrait pour un slug.
    window.location.href = `${appUrl}/g/${checkout.token}`;
  }

  const footer = (
    <>
      <div className={styles.legal}>
        Une photo de vous que vous ne voulez pas ici ? <Link href={`${basePath}/retrait`}>Demandez son retrait</Link>, sans justification.
      </div>
      <div className={styles.powered}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>
    </>
  );

  if (!slot) {
    // Un lien ouvert directement sur une galerie : le créneau n'est pas encore
    // résolu, mais l'écran de choix serait un clignotement de trop. En cas
    // d'échec réseau on retombe sur l'écran des heures, qui sait le dire.
    if (slotId && slotsState === "loading") {
      return (
        <>
          <LoadingBlock label="Chargement des photos du créneau…" />
          {footer}
        </>
      );
    }
    return (
      <>
        <SessionRetrieval
          days={days}
          dateKey={dateKey}
          dayLabel={dayLabel}
          slots={slots}
          state={slotsState}
          canGoBack={days.length > 1}
          onDay={(day) => go(day.dateKey, "")}
          onSlot={(picked) => go(dateKey, picked.id)}
          onBack={() => go("", "")}
        />
        {footer}
      </>
    );
  }

  const q = quote(pendingIds?.length ?? 0, photos.length, pricing, allLabel(photos.length));

  return (
    <>
      <div className={styles.head}>
        <BackLink onClick={() => go(dateKey, "")} />
        <h1>{slot.activity}</h1>
        <p className={styles.sub}>
          {dayLabel ? `${dayLabel.replace(/^./, (c) => c.toUpperCase())}, ` : ""}
          {slot.label}
        </p>
        <p className={styles.hint}>
          {packOnly ? "Toutes les photos du créneau, en une fois." : "Touchez celles où vous êtes, ou prenez le créneau entier."}
        </p>
      </div>

      {loadingPhotos && photos.length === 0 ? (
        // Un créneau peut porter quarante photos : l'aller-retour se voit.
        <LoadingBlock label="Chargement des photos du créneau…" />
      ) : (
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
      )}

      <div className={styles.legal}>
        Photos conservées 90 jours puis supprimées automatiquement. Une photo de vous que vous ne voulez pas ici ?{" "}
        <Link href={`${basePath}/retrait`}>Demandez son retrait</Link>, sans justification.
      </div>
      <div className={styles.powered}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>
      {/* La barre d'achat est posée par-dessus la page : la réserve de place
          va donc après TOUT le contenu, mentions comprises. Placée avant, elle
          laissait le dernier paragraphe passer sous la barre. */}
      <div className={styles.pad} />

      {pendingIds ? (
        <EmailSheet
          apiBase={apiBase}
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
  apiBase,
  slotId,
  photoIds,
  label,
  amountCents,
  onReady,
  onClose,
}: {
  apiBase: string;
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
      setError("Sans e-mail, nous ne pouvons pas vous envoyer vos photos.");
      return;
    }
    setInvalid(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/slots/${slotId}/checkout`, {
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
      setError("La connexion a été interrompue. Réessayez.");
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
          <label htmlFor="groupEmail">Votre e-mail</label>
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
          <div className={styles.why}>Vos photos vous sont envoyées à cette adresse dès le paiement.</div>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="button" className={styles.cta} onClick={() => void submit()} disabled={loading}>
          {loading ? (
            <>
              <Spinner size={17} tone="light" />
              Un instant…
            </>
          ) : (
            "Continuer"
          )}
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
