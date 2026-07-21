"use client";

import { useState } from "react";
import { StripeConnectOnboarding } from "@/components/StripeConnectOnboarding";
import { Button } from "@/components/ui/Button";

const BENEFITS = [
  "Versements automatiques sur ton compte après chaque vente",
  "80 % pour toi, 20 % de commission Souvenir — rien à calculer",
  "Tu gardes le contrôle total de ton compte Stripe",
];

export function StepPayments({ onDone }: { onDone: (stripeOnboarded: boolean) => void }) {
  const [started, setStarted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function handleExit() {
    setSyncing(true);
    try {
      const res = await fetch("/api/stripe/connect/sync", { method: "POST" });
      const data = (await res.json()) as { stripeOnboarded?: boolean };
      onDone(!!data.stripeOnboarded);
    } catch {
      onDone(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Activons vos paiements.
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-ink-2">
        Connecte Stripe pour encaisser directement sur ton compte.
      </p>

      {!started ? (
        <div className="mt-8 max-w-xl">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <ul className="flex flex-col gap-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-ink-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
                    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button variant="accent" size="md" onClick={() => setStarted(true)}>
                Connecter Stripe
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M6 3l5 5-5 5" />
                </svg>
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
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            Connexion sécurisée, propulsée par Stripe.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 max-w-xl overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {syncing ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-10 text-center text-sm text-ink-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                Vérification de ton compte…
              </div>
            ) : (
              <div className="min-h-[320px] p-6">
                <StripeConnectOnboarding accentColor="#FF5A1F" onExit={handleExit} />
              </div>
            )}
          </div>

          {!syncing && (
            <button
              type="button"
              onClick={() => onDone(false)}
              className="mt-5 text-sm text-muted underline underline-offset-2 hover:text-ink-2"
            >
              Passer cette étape, je le ferai plus tard
            </button>
          )}
        </>
      )}
    </div>
  );
}
