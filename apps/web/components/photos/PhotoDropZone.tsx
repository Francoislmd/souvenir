"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { addUploadItem, getUploadItemsForSortie, updateUploadItem, type UploadItem } from "@/lib/idb";

const UPLOAD_CONCURRENCY = 3;

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
  onAllRegistered,
}: {
  sortieId: string;
  /** Appelé dès que toutes les photos déposées ont leur fiche créée côté serveur —
   * pas besoin d'attendre la fin de l'envoi des fichiers ni leur traitement (miniatures). */
  onAllRegistered: () => void;
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

  // Étape rapide, séparée de l'envoi du fichier : crée la fiche photo côté
  // serveur (pour connaître le total exact tout de suite) sans attendre que
  // les octets du fichier soient envoyés.
  const registerOne = useCallback(
    async (item: UploadItem): Promise<void> => {
      if (item.photoId && item.signedUrl) return;
      try {
        const res = await fetch(`/api/sorties/${sortieId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: item.filename }),
        });
        if (!res.ok) throw new Error("init failed");
        const data = (await res.json()) as { photoId: string; signedUrl: string };
        await updateUploadItem(item.id, { photoId: data.photoId, signedUrl: data.signedUrl });
      } catch {
        // L'envoi (uploadOne) réessaiera l'enregistrement s'il manque encore.
      }
    },
    [sortieId],
  );

  const uploadOne = useCallback(
    async (item: UploadItem): Promise<boolean> => {
      await updateUploadItem(item.id, { status: "uploading", progress: 0, error: undefined });
      await refresh();
      try {
        await registerOne(item);
        const fresh = await getUploadItemsForSortie(sortieId);
        const registered = fresh.find((i) => i.id === item.id);
        const photoId = registered?.photoId;
        const signedUrl = registered?.signedUrl;
        if (!photoId || !signedUrl) throw new Error("not registered");

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
    [sortieId, refresh, registerOne],
  );

  // Envoie les fichiers avec quelques envois en parallèle plutôt qu'un par un —
  // les fiches sont déjà créées (registerOne), ceci ne fait qu'accélérer l'envoi
  // des octets et la génération des miniatures, en arrière-plan.
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    const claimed = new Set<string>();
    const worker = async (): Promise<void> => {
      for (;;) {
        const all = await getUploadItemsForSortie(sortieId);
        const next = all.find((item) => (item.status === "queued" || item.status === "error") && !claimed.has(item.id));
        if (!next) return;
        claimed.add(next.id);
        const ok = await uploadOne(next);
        await refresh();
        if (!ok) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          claimed.delete(next.id);
        }
      }
    };
    try {
      await Promise.all(Array.from({ length: UPLOAD_CONCURRENCY }, () => worker()));
    } finally {
      processingRef.current = false;
    }
  }, [sortieId, refresh, uploadOne]);

  useEffect(() => {
    void (async () => {
      const all = await refresh();
      if (all.length === 0) return;
      const unregistered = all.filter((i) => !i.photoId || !i.signedUrl);
      if (unregistered.length > 0) {
        await Promise.all(unregistered.map((item) => registerOne(item)));
        await refresh();
      }
      onAllRegistered();
      // Reprise : des fichiers déposés avant un rechargement de page reprennent leur envoi.
      if (all.some((i) => i.status === "queued" || i.status === "error" || i.status === "uploading")) void processQueue();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      sortieId,
      file,
      filename: file.name,
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
    }));
    for (const item of newItems) {
      await addUploadItem(item);
    }
    event.target.value = "";
    await refresh();

    // Les fiches sont créées tout de suite (léger, rapide) pour connaître le
    // total exact — la répartition peut démarrer sans attendre l'envoi des
    // fichiers, qui continue ensuite en tâche de fond.
    await Promise.all(newItems.map((item) => registerOne(item)));
    onAllRegistered();
    void processQueue();
  }

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;

  let caption = "Vous n'avez rien à trier";
  if (total > 0) caption = `${done} / ${total} envoyées`;

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
