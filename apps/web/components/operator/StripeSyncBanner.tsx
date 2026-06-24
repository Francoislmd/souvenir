"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function StripeSyncBanner() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [notReady, setNotReady] = useState(false);

  async function handleSync() {
    setChecking(true);
    setNotReady(false);
    try {
      const res = await fetch("/api/stripe/connect/sync", { method: "POST" });
      const data = (await res.json()) as { stripeOnboarded?: boolean };
      if (data.stripeOnboarded) {
        router.refresh(); // le layout se re-render côté serveur, le bandeau disparaît
        return;
      }
      setNotReady(true);
    } catch {
      setNotReady(true);
    }
    setChecking(false);
  }

  return (
    <div className="bg-warning-tint px-4 py-2 text-center text-sm text-warning">
      {notReady ? (
        <>
          Stripe vérifie encore ton compte, ça peut prendre quelques minutes.{" "}
          <button onClick={handleSync} className="font-semibold underline">
            Réessayer
          </button>
        </>
      ) : (
        <>
          Tu peux livrer, mais pas encore encaisser.{" "}
          <Link href="/settings?section=paiements" className="font-semibold underline">
            Activer les paiements
          </Link>
          {" · "}
          <button
            onClick={handleSync}
            disabled={checking}
            className="font-semibold underline disabled:opacity-50"
          >
            {checking ? "Vérification…" : "Vérifier le statut"}
          </button>
        </>
      )}
    </div>
  );
}
