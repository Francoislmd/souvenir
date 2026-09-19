"use client";

import { useState } from "react";
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { formatEuros } from "@/lib/format";
import styles from "@/components/gallery/gallery.module.css";
import { LockIcon } from "@/components/gallery/icons";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";

function PaymentForm({
  amountCents,
  merchantName,
  onSuccess,
  onClose,
}: {
  amountCents: number;
  merchantName?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stripe monte ses champs dans une iframe : sur un téléphone en bord de
  // réseau, la feuille reste vide une bonne seconde avant qu'ils n'arrivent.
  const [ready, setReady] = useState(false);
  // Apple Pay / Google Pay : « unknown » tant que Stripe n'a pas répondu,
  // « none » quand l'appareil ne propose aucun des deux (le séparateur
  // « ou par carte » n'a alors plus de raison d'être).
  const [wallet, setWallet] = useState<"unknown" | "shown" | "none">("unknown");
  // Appareil Apple : Safari expose ApplePaySession (iPhone, iPad, Mac), et
  // tous les navigateurs iOS reposent sur WebKit.
  const [apple] = useState(
    () =>
      typeof window !== "undefined" &&
      ("ApplePaySession" in window || /iPhone|iPad|iPod/.test(navigator.userAgent)),
  );

  // Apple Pay et Google Pay affichent leur propre suivi dans la feuille du
  // système : pas de seconde moulinette sur le bouton carte (guide Apple).
  async function pay(fromWallet = false): Promise<void> {
    if (!stripe || !elements || loading) return;
    if (!fromWallet) setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Le paiement a échoué.");
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Le paiement a échoué.");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onSuccess();
      return;
    }

    setError("Le paiement n'a pas pu être confirmé.");
    setLoading(false);
  }

  return (
    <>
      {/* Apple Pay d'abord, en grand : sur un parking, mouillé, un paiement
          au Face ID est la différence entre payer et renoncer. Google Pay
          prend la même place sur Android. Rien d'autre : ni Link, ni PayPal. */}
      <div hidden={wallet === "none"}>
        <ExpressCheckoutElement
          options={{
            // Un seul bouton, celui de l'appareil : Apple Pay sur iPhone, iPad
            // et Mac, Google Pay ailleurs. Apple Pay en « always » : le guide
            // Apple interdit de le cacher quand l'appareil le prend en charge
            // (sans carte enregistrée, le bouton propose de configurer Apple
            // Pay). Safari le dessine lui-même, c'est le bouton officiel.
            // Google Pay en « auto » : hors d'Android et de Chrome, Stripe en
            // dessinerait une imitation.
            paymentMethods: {
              applePay: apple ? "always" : "never",
              googlePay: apple ? "never" : "auto",
              link: "never",
              paypal: "never",
              amazonPay: "never",
            },
            buttonType: { applePay: "buy", googlePay: "buy" },
            buttonTheme: { applePay: "black", googlePay: "black" },
            // Même hauteur que le bouton carte : Apple Pay jamais plus petit.
            buttonHeight: 52,
            // Pas de maxRows : avec maxRows + overflow « never », Stripe ne
            // rend jamais les boutons (ni événement ready, ni erreur).
            layout: { maxColumns: 1, overflow: "never" },
          }}
          onReady={(e) => {
            const m = e.availablePaymentMethods;
            setWallet(m && (m.applePay || m.googlePay) ? "shown" : "none");
          }}
          onLoadError={() => setWallet("none")}
          // Place de marché : la feuille Apple Pay nomme le vendeur réel et
          // Linktrip (« Payer Deeptown School Surf (via Linktrip) »).
          onClick={(e) => e.resolve(merchantName ? { business: { name: `${merchantName} (via Linktrip)` } } : {})}
          onConfirm={() => void pay(true)}
        />
        {wallet === "shown" ? <p className={styles.or}>ou par carte</p> : null}
      </div>

      {/* Le champ reste monté et visible pour Stripe (masqué en display:none,
          il ne se mesure pas et ne signale jamais sa disponibilité) : on pose
          la moulinette par-dessus, et la place est réservée en attendant. */}
      <div style={{ position: "relative", minHeight: ready ? undefined : 140 }}>
        <div style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? undefined : "none" }}>
          <PaymentElement
            options={{ layout: "tabs", paymentMethodOrder: ["card"], wallets: { applePay: "never", googlePay: "never" } }}
            onReady={() => setReady(true)}
          />
        </div>
        {ready ? null : (
          <div style={{ position: "absolute", inset: 0 }}>
            <LoadingBlock label="Chargement du paiement sécurisé…" pad={34} />
          </div>
        )}
      </div>
      {error ? <p className={styles.error} style={{ marginTop: 12 }}>{error}</p> : null}
      <button type="button" onClick={() => void pay()} disabled={loading || !ready} className={styles.cta} style={{ marginTop: 16 }}>
        {loading ? (
          <>
            <Spinner size={17} tone="light" />
            Paiement en cours…
          </>
        ) : (
          `Payer ${formatEuros(amountCents)} par carte`
        )}
      </button>
      <button type="button" onClick={onClose} className={styles.cancel}>
        Annuler
      </button>
    </>
  );
}

export function PaymentSheet({
  clientSecret,
  stripeAccountId,
  amountCents,
  label,
  merchantName,
  onSuccess,
  onClose,
}: {
  clientSecret: string;
  stripeAccountId: string;
  amountCents: number;
  label: string;
  /** Nom de l'opérateur, affiché dans la feuille Apple Pay. */
  merchantName?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripePromise = getStripe(stripeAccountId);
  if (!stripePromise) return null;

  return (
    <div className={styles.sheet}>
      <div className={styles.bd} onClick={onClose} />
      <div className={styles.pn}>
        <span className={styles.grab} />
        <div className={styles.sum}>
          <span>{label}</span>
          <b>{formatEuros(amountCents)}</b>
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret, locale: "fr", appearance: { theme: "stripe", variables: { borderRadius: "14px" } } }}>
          <PaymentForm amountCents={amountCents} merchantName={merchantName} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
        <div className={styles.fine}>
          <LockIcon />
          Paiement sécurisé par Stripe · aucun compte à créer
        </div>
      </div>
    </div>
  );
}
