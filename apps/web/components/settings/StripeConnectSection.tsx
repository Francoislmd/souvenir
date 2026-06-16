"use client";

import { useState } from "react";

export function StripeConnectSection({
  stripeAccountId,
  stripeOnboarded,
}: {
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();

    if (!res.ok || !data.url) {
      setLoading(false);
      setError("Le réseau a coupé — réessaie dans une minute.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-base font-semibold text-ink">Paiements</h2>

      {stripeOnboarded ? (
        <p className="rounded-control bg-success-tint px-4 py-3 text-sm text-success">✅ Les paiements sont actifs.</p>
      ) : (
        <>
          <p className="text-sm text-ink-2">
            {stripeAccountId
              ? "Ta configuration Stripe n'est pas terminée — continue pour pouvoir encaisser le pack HD."
              : "Connecte Stripe pour encaisser le pack HD directement sur ton compte (80 % pour toi, 20 % pour Souvenir)."}
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="h-11 rounded-control bg-accent text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Redirection…" : stripeAccountId ? "Continuer la configuration" : "Connecter Stripe"}
          </button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </>
      )}
    </section>
  );
}
