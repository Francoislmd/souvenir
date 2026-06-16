"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewDeliverySheet() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import-batches", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { batchId: string };
      router.push(`/sessions/import/${data.batchId}`);
    } catch {
      setError("Le réseau a coupé — réessaie dans une minute.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="flex h-14 items-center justify-center rounded-control bg-accent text-base font-semibold text-white shadow-card transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-60"
      >
        {loading ? "…" : "+ Nouvelle livraison"}
      </button>
      {error ? <p className="text-center text-sm text-danger">{error}</p> : null}
    </div>
  );
}
