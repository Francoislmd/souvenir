"use client";

import { useState } from "react";
import styles from "@/app/(operator)/operator.module.css";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

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
      <div className={styles.rgFoot}>
        <span className={styles.rgFootIc}>
          <CheckIcon />
        </span>
        <span className={styles.rgFootText}>Paiements actifs · virement le vendredi</span>
      </div>
    );
  }

  return (
    <div className={styles.rgFoot}>
      <span className={styles.rgFootText}>
        Connectez Stripe pour encaisser vos ventes. Sans lui, vos galeries s&rsquo;ouvrent mais personne ne peut payer.
      </span>
      <button type="button" className={`${styles.sBtn} ${styles.sBtnInk} ${styles.sBtnSm}`} onClick={handleConnect} disabled={loading}>
        {loading ? "…" : "Connecter Stripe"}
      </button>
    </div>
  );
}
