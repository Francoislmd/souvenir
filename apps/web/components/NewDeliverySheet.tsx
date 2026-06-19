"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewDeliverySheet() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startBatch(): Promise<void> {
    if (loading) return;
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
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={startBatch}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-card transition active:scale-[0.98] disabled:opacity-60"
        style={{ background: "var(--brand-gradient)" }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
          <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
        </svg>
        {loading ? "Création…" : "Nouvelle livraison"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
