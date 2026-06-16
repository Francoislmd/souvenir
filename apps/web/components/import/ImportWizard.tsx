"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadQueue, type UploadStatus } from "@/components/UploadQueue";
import { FolderCard } from "./FolderCard";
import { defaultGalleryTitle, renderDeliveryMessage } from "@/lib/message-templates";
import { getUploadItemsForOwner } from "@/lib/idb";

export interface ImportMedia {
  id: string;
  kind: "PHOTO" | "VIDEO";
  localUrl: string;
}

export interface ImportGroup {
  id: string;
  label: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  title: string;
  titleTouched: boolean;
  mediaIds: string[];
}

type Step = 1 | 2;

interface FinalizeResult {
  id: string;
  code: string;
  clientName: string | null;
  emailSent: boolean;
  smsSent: boolean;
  sendErrors?: string[];
}

const STEP_LABELS: Record<Step, string> = {
  1: "Photos",
  2: "Validation",
};

export function ImportWizard({
  batchId,
  operatorName,
  messageTemplate,
}: {
  batchId: string;
  operatorName: string;
  messageTemplate: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [localMediaMap, setLocalMediaMap] = useState<Record<string, ImportMedia>>({});
  const [groups, setGroups] = useState<ImportGroup[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<FinalizeResult[] | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ total: 0, done: 0, hasError: false, failedMediaIds: [] });
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function handleFilesQueued(items: Array<{ id: string; file: Blob; kind: "PHOTO" | "VIDEO" }>): void {
    const newEntries: [string, ImportMedia][] = [];
    for (const item of items) {
      const url = URL.createObjectURL(item.file);
      objectUrlsRef.current.push(url);
      newEntries.push([item.id, { id: item.id, kind: item.kind, localUrl: url }]);
    }

    setLocalMediaMap((prev) => ({ ...prev, ...Object.fromEntries(newEntries) }));

    const newIds = items.map((i) => i.id);
    setGroups((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: crypto.randomUUID(),
            label: "Toutes les photos",
            clientName: "",
            clientEmail: "",
            clientPhone: "",
            title: defaultGalleryTitle(""),
            titleTouched: false,
            mediaIds: newIds,
          },
        ];
      }
      const [first, ...rest] = prev;
      return [{ ...first, mediaIds: [...first.mediaIds, ...newIds] }, ...rest];
    });

    setStep(2);
  }

  function updateGroup(groupId: string, patch: Partial<ImportGroup>): void {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const next = { ...group, ...patch };
        if (patch.clientName !== undefined && !next.titleTouched) {
          next.title = defaultGalleryTitle(patch.clientName);
        }
        return next;
      }),
    );
  }

  function moveMedia(groupId: string, mediaId: string, target: string | "new"): void {
    setGroups((prev) => {
      const withoutMedia = prev.map((group) =>
        group.id === groupId ? { ...group, mediaIds: group.mediaIds.filter((id) => id !== mediaId) } : group,
      );

      if (target === "new") {
        return [
          ...withoutMedia,
          {
            id: crypto.randomUUID(),
            label: "Nouveau dossier",
            clientName: "",
            clientEmail: "",
            clientPhone: "",
            title: defaultGalleryTitle(""),
            titleTouched: false,
            mediaIds: [mediaId],
          },
        ];
      }

      return withoutMedia.map((group) =>
        group.id === target ? { ...group, mediaIds: [...group.mediaIds, mediaId] } : group,
      );
    });
  }

  function addEmptyGroup(): void {
    setGroups((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "Nouveau dossier",
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        title: defaultGalleryTitle(""),
        titleTouched: false,
        mediaIds: [],
      },
    ]);
  }

  function removeGroup(groupId: string): void {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  }

  const sendableGroups = groups.filter((group) => group.mediaIds.length > 0 && (group.clientEmail || group.clientPhone));
  const allUploaded = uploadStatus.total > 0 && uploadStatus.done === uploadStatus.total;

  async function handleSend(): Promise<void> {
    setSendError(null);
    if (sendableGroups.length === 0) return;
    setSending(true);

    try {
      // Resolve IDB item IDs → DB media IDs (available after upload)
      const idbItems = await getUploadItemsForOwner(batchId);
      const idbToMediaId = new Map(
        idbItems.filter((item) => item.mediaId).map((item) => [item.id, item.mediaId as string]),
      );

      const resolvedGroups = sendableGroups
        .map((group) => ({
          ...group,
          mediaIds: group.mediaIds.map((idbId) => idbToMediaId.get(idbId)).filter((id): id is string => Boolean(id)),
        }))
        .filter((group) => group.mediaIds.length > 0);

      if (resolvedGroups.length === 0) {
        setSendError("Les photos sont encore en cours d'envoi — réessaie dans quelques secondes.");
        setSending(false);
        return;
      }

      const res = await fetch(`/api/import-batches/${batchId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groups: resolvedGroups.map((group) => ({
            mediaIds: group.mediaIds,
            clientName: group.clientName || null,
            clientEmail: group.clientEmail || null,
            clientPhone: group.clientPhone || null,
            title: group.title || null,
          })),
        }),
      });

      if (!res.ok) {
        setSendError("L'envoi a échoué — réessaie.");
        setSending(false);
        return;
      }

      const data = (await res.json()) as { deliveries: FinalizeResult[] };
      setResults(data.deliveries);
    } catch {
      setSendError("Le réseau a coupé — réessaie dans une minute.");
      setSending(false);
    }
  }

  if (results) {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-success bg-success-tint p-5 text-center">
        <p className="text-base font-semibold text-ink">C&apos;est envoyé ! 🎉</p>
        <p className="text-sm text-ink-2">
          {results.length} livraison{results.length > 1 ? "s ont" : " a"} été{results.length > 1 ? "s" : ""} créée
          {results.length > 1 ? "s" : ""}.
        </p>
        <ul className="flex flex-col gap-1.5 text-left">
          {results.map((result) => (
            <li
              key={result.id}
              className="flex items-center justify-between rounded-control border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="font-medium text-ink">{result.clientName || result.code}</span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-ink-2">
                  {result.emailSent ? "✓ email " : ""}
                  {result.smsSent ? "✓ sms" : ""}
                  {!result.emailSent && !result.smsSent ? "non envoyé" : ""}
                </span>
                {result.sendErrors && result.sendErrors.length > 0 ? (
                  <span className="max-w-[180px] truncate text-right text-[10px] text-warning">{result.sendErrors[0]}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => router.push("/sessions")}
          className="mt-2 flex h-14 items-center justify-center rounded-control bg-accent text-base font-semibold text-white shadow-card transition hover:bg-accent-hover active:scale-[0.99]"
        >
          Retour aux livraisons
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        {([1, 2] as Step[]).map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                s <= step ? "bg-accent text-white" : "bg-canvas text-ink-2"
              }`}
            >
              {s}
            </span>
            <span className={`text-xs font-medium ${s === step ? "text-ink" : "text-ink-2"}`}>{STEP_LABELS[s]}</span>
            {s < 2 ? <span className="h-px flex-1 bg-border" /> : null}
          </div>
        ))}
      </div>

      {/* Toujours monté pour que les uploads continuent en arrière-plan */}
      <div className={step !== 1 ? "hidden" : ""}>
        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <div>
            <h2 className="text-base font-semibold text-ink">Ajoute toutes les photos et vidéos de la rotation</h2>
            <p className="mt-1 text-sm text-ink-2">Mélange tous les passagers, tu les répartiras par personne juste après.</p>
          </div>
          <UploadQueue ownerType="batch" ownerId={batchId} onStatusChange={setUploadStatus} onFilesQueued={handleFilesQueued} />
        </section>
      </div>

      {step === 2 ? (
        <section className="flex flex-col gap-3">
          {!allUploaded && uploadStatus.total > 0 ? (
            <div className="flex items-center gap-3 rounded-card border border-border bg-canvas px-4 py-3">
              <span className="animate-spin text-base">✨</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">
                  Upload en cours… {uploadStatus.done} / {uploadStatus.total}
                </span>
                {uploadStatus.hasError ? (
                  <span className="text-xs text-warning">Le réseau a coupé — reprend tout seul</span>
                ) : null}
              </div>
            </div>
          ) : null}

          {groups.map((group, index) => (
            <FolderCard
              key={group.id}
              group={group}
              index={index}
              media={localMediaMap}
              otherGroups={groups
                .filter((other) => other.id !== group.id)
                .map((other) => {
                  const num = groups.findIndex((g) => g.id === other.id) + 1;
                  const firstName = other.clientName.split(/\s+/)[0];
                  return { id: other.id, label: firstName || `Dossier ${num}` };
                })}
              onChange={(patch) => updateGroup(group.id, patch)}
              onMoveMedia={(mediaId, target) => moveMedia(group.id, mediaId, target)}
              onRemove={() => removeGroup(group.id)}
            />
          ))}

          <button
            type="button"
            onClick={addEmptyGroup}
            className="rounded-control border border-dashed border-border-strong px-4 py-3 text-sm font-medium text-ink-2 transition hover:border-accent hover:text-accent active:scale-[0.99]"
          >
            + Nouveau dossier
          </button>

          {sendableGroups.length > 0 ? (
            <div className="rounded-control border border-border bg-canvas p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aperçu du message</p>
              <p className="mt-1 text-sm text-ink-2">
                {renderDeliveryMessage(messageTemplate, {
                  clientName: sendableGroups[0].clientName.split(/\s+/)[0] || "",
                  operatorName,
                })}
              </p>
            </div>
          ) : null}

          {sendError ? <p className="text-sm text-danger">{sendError}</p> : null}

          <button
            type="button"
            onClick={handleSend}
            disabled={sendableGroups.length === 0 || sending || !allUploaded}
            className="flex h-14 items-center justify-center rounded-control bg-accent text-base font-semibold text-white shadow-card transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-60"
          >
            {sending
              ? "Envoi en cours…"
              : !allUploaded && uploadStatus.total > 0
                ? `Upload en cours (${uploadStatus.done}/${uploadStatus.total})…`
                : `Envoyer à tout le monde (${sendableGroups.length})`}
          </button>
        </section>
      ) : null}
    </div>
  );
}
