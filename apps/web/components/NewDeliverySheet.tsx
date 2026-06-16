"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewDeliverySheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"single" | "batch" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (loading) return;
    setOpen(false);
    setError(null);
  }

  async function startSingle(): Promise<void> {
    setLoading("single");
    setError(null);
    try {
      const res = await fetch("/api/deliveries", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { deliveryId: string };
      router.push(`/sessions/${data.deliveryId}`);
    } catch {
      setError("Le réseau a coupé — réessaie dans une minute.");
      setLoading(null);
    }
  }

  async function startBatch(): Promise<void> {
    setLoading("batch");
    setError(null);
    try {
      const res = await fetch("/api/import-batches", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { batchId: string };
      router.push(`/sessions/import/${data.batchId}`);
    } catch {
      setError("Le réseau a coupé — réessaie dans une minute.");
      setLoading(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-card transition active:scale-[0.98]"
        style={{ background: "var(--brand-gradient)" }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
          <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
        </svg>
        Nouvelle livraison
      </button>

      {open ? (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
            onClick={close}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] bg-surface px-5 pb-8 pt-5 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
            {/* Handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Nouvelle livraison</h2>
              <button
                type="button"
                onClick={close}
                disabled={loading !== null}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-2 transition hover:bg-canvas hover:text-ink"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={startSingle}
                disabled={loading !== null}
                className="flex items-center gap-4 rounded-card border border-border bg-canvas px-4 py-4 text-left transition hover:border-accent hover:bg-accent-tint active:scale-[0.99] disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-2xl shadow-card">
                  👤
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Une personne</p>
                  <p className="text-xs text-ink-2">Upload et envoie directement à un client</p>
                </div>
                {loading === "single" ? (
                  <span className="text-xs text-ink-2">…</span>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-muted">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={startBatch}
                disabled={loading !== null}
                className="flex items-center gap-4 rounded-card border border-border bg-canvas px-4 py-4 text-left transition hover:border-accent hover:bg-accent-tint active:scale-[0.99] disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-2xl shadow-card">
                  👥
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Toute une rotation</p>
                  <p className="text-xs text-ink-2">Upload tout le lot, répartis par personne</p>
                </div>
                {loading === "batch" ? (
                  <span className="text-xs text-ink-2">…</span>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-muted">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            {error ? <p className="mt-4 text-center text-sm text-danger">{error}</p> : null}
          </div>
        </>
      ) : null}
    </>
  );
}
