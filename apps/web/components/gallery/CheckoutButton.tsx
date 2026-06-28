"use client";

import { useState } from "react";
import { formatEuros } from "@/lib/format";
import { stripePromise } from "@/lib/stripe-client";
import { CheckoutSheet } from "./CheckoutSheet";

export function CheckoutButton({
  deliveryId,
  priceCents,
  inline = false,
}: {
  deliveryId: string;
  priceCents: number;
  inline?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    if (!stripePromise) {
      setError("Le paiement n'est pas encore activé pour cette école — réessaie un peu plus tard 🙂");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };

      if (!res.ok || !data.clientSecret) {
        if (data.error === "stripe_not_ready") {
          setError("Le paiement n'est pas encore activé pour cette école — réessaie un peu plus tard 🙂");
        } else {
          setError("Le réseau a coupé — réessaie dans une minute.");
        }
        setLoading(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setLoading(false);
    } catch {
      setError("Le réseau a coupé — réessaie dans une minute.");
      setLoading(false);
    }
  }

  const buttonLabel = loading ? (
    "Chargement…"
  ) : (
    <>
      Débloquer mes souvenirs
      <span className="flex h-10 items-center rounded-full bg-white/15 px-4 text-base">{formatEuros(priceCents)}</span>
    </>
  );

  return (
    <>
      {inline ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-accent pl-6 pr-2 text-base font-semibold text-white shadow-card transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-60"
          >
            {buttonLabel}
          </button>
          {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
        </div>
      ) : (
        <div
          className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-4 pb-5 pt-8"
          style={{ background: "linear-gradient(to bottom, transparent, var(--canvas) 40%)" }}
        >
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="flex h-14 items-center gap-3 rounded-full bg-accent pl-6 pr-2 text-base font-semibold text-white shadow-xl shadow-black/20 transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-60"
          >
            {buttonLabel}
          </button>
          {error ? <p className="rounded-full bg-surface px-3 py-1 text-center text-xs text-danger shadow-card">{error}</p> : null}
        </div>
      )}

      {clientSecret ? (
        <CheckoutSheet
          clientSecret={clientSecret}
          priceLabel={formatEuros(priceCents)}
          onClose={() => setClientSecret(null)}
        />
      ) : null}
    </>
  );
}
