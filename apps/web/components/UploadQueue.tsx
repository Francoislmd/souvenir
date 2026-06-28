"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ChangeEvent } from "react";
import { addUploadItem, getUploadItemsForOwner, updateUploadItem, type UploadItem, type UploadOwnerType } from "@/lib/idb";
import type { MediaStatus } from "@souvenir/db";

export interface UploadStatus {
  total: number;
  done: number;
  hasError: boolean;
  failedMediaIds: string[];
}

function putToSignedUrl(url: string, file: Blob, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.send(file);
  });
}

export interface UploadQueueHandle {
  trigger: () => void;
}

export const UploadQueue = forwardRef<UploadQueueHandle, {
  ownerType: UploadOwnerType;
  ownerId: string;
  onStatusChange?: (status: UploadStatus) => void;
  onFilesQueued?: (items: Array<{ id: string; file: Blob; kind: "PHOTO" | "VIDEO" }>) => void;
}>(function UploadQueue({
  ownerType,
  ownerId,
  onStatusChange,
  onFilesQueued,
}, ref) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({ trigger: () => inputRef.current?.click() }), []);
  const processingRef = useRef(false);

  const mediaEndpoint =
    ownerType === "delivery" ? `/api/deliveries/${ownerId}/media` : `/api/import-batches/${ownerId}/media`;

  const refresh = useCallback(async () => {
    const all = await getUploadItemsForOwner(ownerId);
    setItems(all.sort((a, b) => a.createdAt - b.createdAt));
  }, [ownerId]);

  const [mediaStatus, setMediaStatus] = useState<Record<string, MediaStatus>>({});

  const refreshMediaStatus = useCallback(async () => {
    const res = await fetch(mediaEndpoint);
    if (!res.ok) return;
    const data = (await res.json()) as { media: { id: string; status: MediaStatus }[] };
    setMediaStatus(Object.fromEntries(data.media.map((m) => [m.id, m.status])));
  }, [mediaEndpoint]);


  const uploadOne = useCallback(
    async (item: UploadItem): Promise<boolean> => {
      await updateUploadItem(item.id, { status: "uploading", progress: 0, error: undefined });
      await refresh();

      try {
        let mediaId = item.mediaId;
        let signedUrl = item.signedUrl;

        if (!mediaId || !signedUrl) {
          const res = await fetch("/api/uploads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(ownerType === "delivery" ? { deliveryId: ownerId } : { batchId: ownerId }),
              kind: item.kind,
              filename: item.filename,
            }),
          });
          if (!res.ok) throw new Error("init failed");
          const data = (await res.json()) as { mediaId: string; signedUrl: string };
          mediaId = data.mediaId;
          signedUrl = data.signedUrl;
          await updateUploadItem(item.id, { mediaId, signedUrl });
        }

        await putToSignedUrl(signedUrl, item.file, (progress) => {
          void updateUploadItem(item.id, { progress });
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
        });

        const completeRes = await fetch(`/api/media/${mediaId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sizeBytes: item.file.size }),
        });
        if (!completeRes.ok) throw new Error("complete failed");

        await updateUploadItem(item.id, { status: "done", progress: 100 });
        return true;
      } catch {
        await updateUploadItem(item.id, {
          status: "error",
          error: "Réseau coupé — reprend tout seul",
        });
        return false;
      }
    },
    [ownerType, ownerId, refresh],
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      for (;;) {
        const all = await getUploadItemsForOwner(ownerId);
        const next = all.find((item) => item.status === "queued" || item.status === "error");
        if (!next) break;

        const ok = await uploadOne(next);
        await refresh();
        if (!ok) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [ownerId, refresh, uploadOne]);

  useEffect(() => {
    void refresh().then(() => void processQueue());

    function handleOnline() {
      void processQueue();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refresh, processQueue]);

  useEffect(() => {
    void refreshMediaStatus();
    const interval = setInterval(() => void refreshMediaStatus(), 4000);
    return () => clearInterval(interval);
  }, [refreshMediaStatus]);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const queued: Array<{ id: string; file: Blob; kind: "PHOTO" | "VIDEO" }> = [];
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const kind: UploadItem["kind"] = file.type.startsWith("video") ? "VIDEO" : "PHOTO";
      await addUploadItem({ id, ownerId, ownerType, file, filename: file.name, kind, status: "queued", progress: 0, createdAt: Date.now() });
      queued.push({ id, file, kind });
    }

    onFilesQueued?.(queued);
    event.target.value = "";
    await refresh();
    void processQueue();
  }

  useEffect(() => {
    const failedMediaIds = items
      .map((item) => item.mediaId)
      .filter((mediaId): mediaId is string => Boolean(mediaId) && mediaStatus[mediaId as string] === "FAILED");

    onStatusChange?.({
      total: items.length,
      done: items.filter((item) => item.status === "done").length,
      hasError: items.some((item) => item.status === "error"),
      failedMediaIds,
    });
  }, [items, mediaStatus, onStatusChange]);

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFilesSelected}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-control border border-dashed border-border-strong bg-canvas px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:bg-accent-tint active:scale-[0.99]"
      >
        <span className="text-lg">📸</span>
        Ajouter des photos / vidéos
      </button>
    </div>
  );
});
