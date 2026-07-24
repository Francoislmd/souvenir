"use client";

import { useState } from "react";
import styles from "@/app/(operator)/operator.module.css";

export function StripeConnectSection({ stripeOnboarded }: { stripeOnboarded: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect(): Promise<void> {
    setLoading(true);
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnPath: "/reglages" }),
    });
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setLoading(false);
  }

  if (stripeOnboarded) {
    return (
      <div className={styles.soon} style={{ borderLeftColor: "var(--ok)" }}>
        <div>
          <div className={styles.t}>Paiements activés</div>
          <div className={styles.h}>Vous encaissez directement sur votre compte Stripe.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.soon}>
      <div style={{ flex: 1 }}>
        <div className={styles.t}>Paiements</div>
        <div className={styles.h}>Connectez Stripe pour encaisser vos ventes — vous gardez 80 %.</div>
      </div>
      <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={handleConnect} disabled={loading} style={{ flex: "0 0 auto" }}>
        {loading ? "…" : "Connecter"}
      </button>
    </div>
  );
}
