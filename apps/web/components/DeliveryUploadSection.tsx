"use client";

import { useState } from "react";
import { UploadQueue, type UploadStatus } from "@/components/UploadQueue";

export function DeliveryUploadSection({ deliveryId }: { deliveryId: string }) {
  const [status, setStatus] = useState<UploadStatus>({ total: 0, done: 0, hasError: false, failedMediaIds: [] });

  return (
    <div className="flex flex-col gap-3">
      <UploadQueue ownerType="delivery" ownerId={deliveryId} onStatusChange={setStatus} />

      {status.total > 0 ? (
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
          {status.done < status.total ? (
            <span className="animate-spin text-lg text-accent">↻</span>
          ) : (
            <span className="text-lg text-success">✓</span>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ink">
              {status.done < status.total ? "Envoi en cours…" : "Envoi terminé"}
            </span>
            <span className="text-xs text-ink-2">
              {status.done} / {status.total} envoyé{status.total > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      ) : null}

      {status.hasError ? (
        <p className="text-sm text-warning">Le réseau a coupé — l&apos;envoi reprendra tout seul.</p>
      ) : null}

      {status.failedMediaIds.length > 0 ? (
        <RetryButton mediaIds={status.failedMediaIds} />
      ) : null}
    </div>
  );
}

function RetryButton({ mediaIds }: { mediaIds: string[] }) {
  function retry() {
    mediaIds.forEach((mediaId) => {
      void fetch(`/api/media/${mediaId}/retry`, { method: "POST" });
    });
  }

  return (
    <button
      type="button"
      onClick={retry}
      className="rounded-full bg-warning-tint px-3 py-1 text-xs font-semibold text-warning active:scale-[0.97]"
    >
      Échec sur {mediaIds.length} média{mediaIds.length > 1 ? "s" : ""} — réessayer
    </button>
  );
}
