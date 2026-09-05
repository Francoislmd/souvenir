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

export interface UploadProgress {
  done: number;
  total: number;
  /** Fiches photo dont les octets ne sont pas encore arrivés : l'écran les
   *  affiche en retrait dans la grille plutôt que de masquer la vignette. */
  pending: string[];
}

export function PhotoDropZone({
  sortieId,
  onAllRegistered,
  onProgress,
  variant = "zone",
  openRef,
  label,
}: {
  sortieId: string;
  /** Appelé dès que toutes les photos déposées ont leur fiche créée côté serveur —
   * pas besoin d'attendre la fin de l'envoi des fichiers ni leur traitement (miniatures). */
  onAllRegistered: () => void;
  /** L'avancement est remonté à l'écran de la sortie, qui l'affiche dans sa
   *  barre basse — le dépôt ne dessine pas sa propre grille de vignettes. */
  onProgress?: (progress: UploadProgress) => void;
  /** "silent" ne rend que le champ de fichier : le composant reste monté —
   *  donc la file d'envoi continue de tourner — sans rien afficher. */
  variant?: "zone" | "button" | "silent";
  /** Reçoit une fonction qui ouvre le sélecteur de fichiers, pour qu'un
   *  bouton placé ailleurs (la barre basse) déclenche ce dépôt-ci. */
  openRef?: React.MutableRefObject<(() => void) | null>;
  label?: string;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
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
    if (openRef) openRef.current = () => inputRef.current?.click();
    return () => {
      if (openRef) openRef.current = null;
    };
  }, [openRef]);

  useEffect(() => {
    void (async () => {
      let all = await refresh();
      if (all.length === 0) return;

      // Un envoi interrompu — onglet fermé, rechargement, navigation — laisse
      // des éléments en "uploading". La file ne réclame que "queued" et
      // "error" : personne ne les reprenait, et l'avancement restait figé à
      // « 0 sur 6 » pour toujours. On les remet dans la file.
      const stalled = all.filter((i) => i.status === "uploading");
      if (stalled.length > 0) {
        await Promise.all(stalled.map((item) => updateUploadItem(item.id, { status: "queued", progress: 0 })));
        all = await refresh();
      }

      const unregistered = all.filter((i) => !i.photoId || !i.signedUrl);
      if (unregistered.length > 0) {
        await Promise.all(unregistered.map((item) => registerOne(item)));
        all = await refresh();
      }
      onAllRegistered();
      // Reprise : des fichiers déposés avant un rechargement de page reprennent leur envoi.
      if (all.some((i) => i.status === "queued" || i.status === "error")) void processQueue();
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

  useEffect(() => {
    if (!onProgress) return;
    onProgress({
      done,
      total,
      pending: items.filter((i) => i.status !== "done" && i.photoId).map((i) => i.photoId as string),
    });
    // `items` porte déjà l'avancement ; `onProgress` est stable côté appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, done, total]);

  if (variant === "silent") {
    return <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFilesSelected} className="hidden" />;
  }

  if (variant === "button") {
    return (
      <>
        <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFilesSelected} className="hidden" />
        <button type="button" className={`${styles.sBtn} ${styles.sBtnSm} ${styles.sdChip}`} onClick={() => inputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5.8v12.4M5.8 12h12.4" />
          </svg>
          <span className={styles.sdChipLabel}>{label ?? "Ajouter des photos"}</span>
        </button>
      </>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFilesSelected} className="hidden" />
      <button type="button" className={styles.sdDrop} onClick={() => inputRef.current?.click()}>
        <span className={styles.sdDropIc}>
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 17V4.5" />
            <path d="M6.5 10 12 4.5 17.5 10" />
            <path d="M4 15.5v2.8A2.2 2.2 0 0 0 6.2 20.5h11.6a2.2 2.2 0 0 0 2.2-2.2v-2.8" />
          </svg>
        </span>
        <span className={styles.sdDropT}>{label ?? "Déposez les photos de la sortie"}</span>
        <span className={styles.sdDropH}>Videz la carte mémoire d&rsquo;un coup. Glissez-les ici, ou choisissez-les sur l&rsquo;appareil.</span>
        <span className={`${styles.sBtn} ${styles.sBtnPri}`}>Choisir les photos</span>
      </button>
    </>
  );
}
