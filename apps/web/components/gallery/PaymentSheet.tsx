"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { formatEuros } from "@/lib/format";
import styles from "@/components/gallery/gallery.module.css";
import { LockIcon } from "@/components/gallery/icons";

function PaymentForm({ amountCents, onSuccess, onClose }: { amountCents: number; onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (!stripe || !elements || loading) return;
    setLoading(true);
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
      {/* Apple Pay et Google Pay arrivent en tête de l'accordéon quand
          l'appareil les propose : sur un parking, mouillé, c'est la
          différence entre payer et renoncer. */}
      <PaymentElement options={{ layout: "accordion" }} />
      {error ? <p className={styles.error} style={{ marginTop: 12 }}>{error}</p> : null}
      <button type="button" onClick={submit} disabled={loading} className={styles.cta} style={{ marginTop: 16 }}>
        {loading ? "Paiement en cours…" : `Payer ${formatEuros(amountCents)}`}
      </button>
      <button type="button" onClick={onClose} className={styles.cancel}>
        Annuler
      </button>
    </>
  );
}

export function PaymentSheet({
  clientSecret,
  amountCents,
  label,
  onSuccess,
  onClose,
}: {
  clientSecret: string;
  amountCents: number;
  label: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
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
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <PaymentForm amountCents={amountCents} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
        <div className={styles.fine}>
          <LockIcon />
          Paiement sécurisé par Stripe · aucun compte à créer
        </div>
      </div>
    </div>
  );
}
