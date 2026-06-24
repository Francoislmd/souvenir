"use client";

import { useEffect, useRef, useState } from "react";
import type { StripeConnectInstance } from "@stripe/connect-js";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";

interface Props {
  onExit: () => void;
}

export function StripeConnectOnboarding({ onExit }: Props) {
  const instanceRef = useRef<StripeConnectInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (instanceRef.current) return;

    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    if (!pk) {
      setError(
        "Clé Stripe manquante — ajoute NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY dans .env.local",
      );
      return;
    }

    // loadConnectAndInitialize utilise des APIs browser — useEffect garantit l'exécution côté client uniquement
    import("@stripe/connect-js")
      .then(({ loadConnectAndInitialize }) => {
        instanceRef.current = loadConnectAndInitialize({
          publishableKey: pk,
          fetchClientSecret: async () => {
            const res = await fetch("/api/stripe/connect/session", {
              method: "POST",
            });
            if (!res.ok)
              throw new Error("Impossible de démarrer la session Stripe.");
            const data = (await res.json()) as { clientSecret: string };
            return data.clientSecret;
          },
          appearance: {
            // "drawer" garde tout en-page — pas de popups ni de nouvelles fenêtres
            overlays: "drawer",
            variables: {
              colorPrimary: "#4f46e5",
              fontFamily: "Inter, sans-serif",
              borderRadius: "12px",
            },
          },
        });
        setReady(true);
      })
      .catch(() => {
        setError("Impossible de charger Stripe. Vérifie ta connexion et réessaie.");
      });
  }, []);

  if (error) {
    return (
      <div className="rounded-card border border-danger bg-danger-tint p-4 text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!ready || !instanceRef.current) {
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        Chargement de Stripe…
      </div>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={instanceRef.current}>
      <ConnectAccountOnboarding onExit={onExit} />
    </ConnectComponentsProvider>
  );
}
