"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function MediaStatusPoller({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();

  useEffect(() => {
    if (pendingCount === 0) return;

    // Poll toutes les 4 s tant qu'il y a des médias non READY
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [pendingCount, router]);

  return null;
}
