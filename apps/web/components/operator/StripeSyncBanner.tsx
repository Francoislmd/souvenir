"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";

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
        router.refresh();
        return;
      }
      setNotReady(true);
    } catch {
      setNotReady(true);
    }
    setChecking(false);
  }

  return (
    <div className={styles.warnbar}>
      {notReady ? (
        <>
          Stripe vérifie encore votre compte, ça peut prendre quelques minutes.{" "}
          <button onClick={handleSync}>Réessayer</button>
        </>
      ) : (
        <>
          Vous pouvez livrer, mais pas encore encaisser.{" "}
          <Link href="/reglages?section=paiements">Activer les paiements</Link>
          {" · "}
          <button onClick={handleSync} disabled={checking}>
            {checking ? "Vérification…" : "Vérifier le statut"}
          </button>
        </>
      )}
    </div>
  );
}
