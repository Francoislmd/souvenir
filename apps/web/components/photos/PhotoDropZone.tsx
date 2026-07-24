"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { addUploadItem, getUploadItemsForSortie, updateUploadItem, type UploadItem } from "@/lib/idb";

function putToSignedUrl(url: string, file: Blob, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`status ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network error"));
    xhr.send(file);
  });
}

export function PhotoDropZone({
  sortieId,
  processing = false,
  onAllUploaded,
}: {
  sortieId: string;
  /** true une fois tous les fichiers envoyés, en attente du traitement serveur */
  processing?: boolean;
  onAllUploaded: (count: number) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const objectUrls = useRef<Map<string, string>>(new Map());

  // Aperçu local instantané — dès qu'un fichier est choisi, on le voit, sans
  // attendre la fin de l'envoi réseau ni le traitement serveur (miniature,
  // filigrane…).
  function previewUrlFor(item: UploadItem): string {
    let url = objectUrls.current.get(item.id);
    if (!url) {
      url = URL.createObjectURL(item.file);
      objectUrls.current.set(item.id, url);
    }
    return url;
  }

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const refresh = useCallback(async () => {
    const all = await getUploadItemsForSortie(sortieId);
    setItems(all.sort((a, b) => a.createdAt - b.createdAt));
    return all;
  }, [sortieId]);

  const uploadOne = useCallback(
    async (item: UploadItem): Promise<boolean> => {
      await updateUploadItem(item.id, { status: "uploading", progress: 0, error: undefined });
      await refresh();
      try {
        let photoId = item.photoId;
        let signedUrl = item.signedUrl;
        if (!photoId || !signedUrl) {
          const res = await fetch(`/api/sorties/${sortieId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: item.filename }),
          });
          if (!res.ok) throw new Error("init failed");
          const data = (await res.json()) as { photoId: string; signedUrl: string };
          photoId = data.photoId;
          signedUrl = data.signedUrl;
          await updateUploadItem(item.id, { photoId, signedUrl });
        }

        await putToSignedUrl(signedUrl, item.file, (progress) => {
          void updateUploadItem(item.id, { progress });
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
        });

        const completeRes = await fetch(`/api/photos/${photoId}/complete`, { method: "POST" });
        if (!completeRes.ok) throw new Error("complete failed");

        await updateUploadItem(item.id, { status: "done", progress: 100 });
        return true;
      } catch {
        await updateUploadItem(item.id, { status: "error", error: "Réseau coupé — reprend tout seul" });
        return false;
      }
    },
    [sortieId, refresh],
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      for (;;) {
        const all = await getUploadItemsForSortie(sortieId);
        const next = all.find((item) => item.status === "queued" || item.status === "error");
        if (!next) {
          const done = all.filter((i) => i.status === "done");
          if (all.length > 0 && done.length === all.length) onAllUploaded(done.length);
          break;
        }
        const ok = await uploadOne(next);
        await refresh();
        if (!ok) await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } finally {
      processingRef.current = false;
    }
  }, [sortieId, refresh, uploadOne, onAllUploaded]);

  useEffect(() => {
    void refresh().then((all) => {
      // Reprise : des fichiers déposés avant un rechargement de page reprennent leur envoi.
      if (all.some((i) => i.status === "queued" || i.status === "error")) void processQueue();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await addUploadItem({
        id: crypto.randomUUID(),
        sortieId,
        file,
        filename: file.name,
        status: "queued",
        progress: 0,
        createdAt: Date.now(),
      });
    }
    event.target.value = "";
    await refresh();
    void processQueue();
  }

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;

  let caption = "Vous n'avez rien à trier";
  if (processing) caption = "Traitement en cours…";
  else if (total > 0) caption = `${done} / ${total} envoyées`;

  return (
    <div>
      <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFilesSelected} className="hidden" />
      <div
        className={styles.drop}
        style={{ marginTop: 20 }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <div className={styles.ic}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
        </div>
        <div className={styles.t}>Déposez toutes les photos</div>
        <div className={styles.h}>{caption}</div>
      </div>

      {items.length > 0 ? (
        <div className={styles.thumbs} style={{ marginTop: 14 }}>
          {items.map((item) => (
            <span key={item.id} className={styles.th2} style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrlFor(item)} alt="" style={{ opacity: item.status === "error" ? 0.5 : 1 }} />
              {item.status === "uploading" || item.status === "queued" ? (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(20,19,32,.28)",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,.5)",
                      borderTopColor: "#fff",
                      animation: "spin .7s linear infinite",
                    }}
                  />
                </span>
              ) : null}
              {item.status === "error" ? (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(220,38,38,.35)",
                    color: "#fff",
                    fontSize: "1.1rem",
                  }}
                >
                  !
                </span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}
