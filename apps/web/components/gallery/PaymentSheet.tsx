"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { formatEuros } from "@/lib/format";
import styles from "@/app/g/[token]/boutique.module.css";

function PaymentForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
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
      <PaymentElement options={{ layout: "accordion" }} />
      {error ? <p style={{ marginTop: 12, fontSize: ".85rem", color: "#dc2626" }}>{error}</p> : null}
      <button type="button" onClick={submit} disabled={loading} className={styles.pay} style={{ marginTop: 16 }}>
        {loading ? "Paiement en cours…" : "Payer"}
      </button>
      <button type="button" onClick={onClose} style={{ marginTop: 8, width: "100%", padding: "8px 0", textAlign: "center", fontSize: ".85rem", fontWeight: 500, color: "var(--ink-3)" }}>
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
        <div className={styles.grab} />
        <h3>Paiement</h3>
        <div className={styles.sum}>
          <span>{label}</span>
          <b>{formatEuros(amountCents)}</b>
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <PaymentForm onSuccess={onSuccess} onClose={onClose} />
        </Elements>
        <div className={styles.fine}>Paiement traité de façon sécurisée.</div>
      </div>
    </div>
  );
}
