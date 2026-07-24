"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const BENEFITS = [
  "Versements automatiques sur votre compte après chaque vente",
  "80 % pour vous, 20 % de commission Linktrip — rien à calculer",
  "Vous gardez le contrôle total de votre compte Stripe",
];

export function StepPayments({ onDone }: { onDone: (stripeOnboarded: boolean) => void }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect(): Promise<void> {
    setLoading(true);
    try {
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
    } catch {
      // ignore — l'opérateur pourra toujours se connecter depuis Réglages
    }
    setLoading(false);
    onDone(false);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Activons vos paiements.
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-ink-2">
        Connectez Stripe pour encaisser directement sur votre compte.
      </p>

      <div className="mt-8 max-w-xl">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <ul className="flex flex-col gap-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-ink-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                  <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8.5l3 3 7-7" />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="md" onClick={handleConnect} disabled={loading}>
              {loading ? "Redirection…" : "Connecter Stripe"}
            </Button>
            <button
              type="button"
              onClick={() => onDone(false)}
              className="text-sm font-medium text-ink-2 underline underline-offset-2 hover:text-ink"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
