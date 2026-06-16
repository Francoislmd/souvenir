"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PurchaseSuccessRefresher() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => router.refresh(), 2000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <p className="rounded-control bg-accent-tint px-4 py-3 text-center text-sm text-accent">
      Paiement reçu, on débloque ta galerie… 🎉
    </p>
  );
}
