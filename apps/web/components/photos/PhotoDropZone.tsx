"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "@/app/(operator)/operator.module.css";
import {
  addUploadItem,
  getUploadItemsForSortie,
  purgeFinishedForSortie,
  updateUploadItem,
  type UploadItem,
} from "@/lib/idb";

/** Envois d'octets en parallèle. Au-delà, on se partage le même débit montant
 *  sans rien gagner, et le navigateur plafonne de toute façon vers 6. */
const UPLOAD_CONCURRENCY = 3;
/** Confirmations de traitement en parallèle. Séparé des envois : c'est du
 *  calcul serveur, il ne doit plus jamais occuper un envoi. */
const FINALIZE_CONCURRENCY = 2;
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 2500;
/** Repeindre l'avancement 8 fois par seconde suffit ; un rendu par paquet
 *  d'octets sature le fil principal et fige justement ce qu'on veut animer. */
const PAINT_INTERVAL_MS = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  /** Photos dont les octets sont arrivés — c'est ça, « envoyer ses photos ». */
  sent: number;
  total: number;
  /** Avancement en octets, 0 → 1. La barre suit celui-ci, pas le nombre de
   *  photos finies : sur 20 photos, une photo finie = un saut de 5 %, entre
   *  deux la barre semblait figée. */
  ratio: number;
  /** Photos envoyées dont l'aperçu se prépare encore côté serveur. */
  finalizing: number;
  /** Photos abandonnées après plusieurs tentatives. */
  failed: number;
  /** Fiches photo dont l'image n'est pas encore prête : l'écran les affiche
   *  en retrait dans la grille plutôt que de masquer la vignette. */
  pending: string[];
}

export interface PhotoDropZoneHandle {
  /** Ouvre le sélecteur de fichiers depuis un bouton placé ailleurs. */
  open: () => void;
  /** Remet en file les photos abandonnées. */
  retryFailed: () => void;
  /** Relit la file locale — après une suppression de photos, par exemple. */
  sync: () => void;
}

export function PhotoDropZone({
  sortieId,
  onAllRegistered,
  onProgress,
  onSettled,
  variant = "zone",
  controlRef,
  label,
}: {
  sortieId: string;
  /** Appelé dès que toutes les photos déposées ont leur fiche créée côté serveur —
   * pas besoin d'attendre la fin de l'envoi des fichiers ni leur traitement (miniatures). */
  onAllRegistered: () => void;
  /** L'avancement est remonté à l'écran de la sortie, qui l'affiche dans sa
   *  barre basse — le dépôt ne dessine pas sa propre grille de vignettes. */
  onProgress?: (progress: UploadProgress) => void;
  /** Appelé quand la file n'a plus rien à faire : l'écran en profite pour
   *  remettre à jour ce que le serveur a rendu (compteurs, miniatures). */
  onSettled?: () => void;
  /** "silent" ne rend que le champ de fichier : le composant reste monté —
   *  donc la file d'envoi continue de tourner — sans rien afficher. */
  variant?: "zone" | "button" | "silent";
  controlRef?: React.MutableRefObject<PhotoDropZoneHandle | null>;
  label?: string;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pumpingRef = useRef(false);
  /** La file s'appelle elle-même : sans ça, des photos déposées pendant que
   *  les derniers aperçus se terminent restaient en attente jusqu'au prochain
   *  chargement de la page. */
  const pumpRef = useRef<(() => void) | null>(null);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  /** L'avancement d'un envoi en cours vit en mémoire, jamais dans IndexedDB :
   *  y écrire à chaque paquet d'octets réécrivait le fichier entier (plusieurs
   *  mégaoctets) des dizaines de fois par seconde. */
  const liveProgress = useRef<Map<string, number>>(new Map());
  const paintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const withLiveProgress = useCallback((all: UploadItem[]): UploadItem[] => {
    return [...all]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((item) => {
        const live = liveProgress.current.get(item.id);
        return live === undefined ? item : { ...item, progress: live };
      });
  }, []);

  const refresh = useCallback(async (): Promise<UploadItem[]> => {
    const all = await getUploadItemsForSortie(sortieId);
    const merged = withLiveProgress(all);
    setItems(merged);
    return merged;
  }, [sortieId, withLiveProgress]);

  const paintProgress = useCallback(() => {
    if (paintTimer.current) return;
    paintTimer.current = setTimeout(() => {
      paintTimer.current = null;
      setItems((prev) =>
        prev.map((item) => {
          const live = liveProgress.current.get(item.id);
          return live === undefined || live === item.progress ? item : { ...item, progress: live };
        }),
      );
    }, PAINT_INTERVAL_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (paintTimer.current) clearTimeout(paintTimer.current);
    };
  }, []);

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

  /** Envoi des octets seulement. Se termine en "sent" : le traitement serveur
   *  (miniature, filigrane — plusieurs secondes de calcul par photo) n'est
   *  plus attendu ici, il occupait un envoi sur trois pendant tout ce temps. */
  const uploadOne = useCallback(
    async (item: UploadItem): Promise<boolean> => {
      liveProgress.current.set(item.id, 0);
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
          liveProgress.current.set(item.id, progress);
          paintProgress();
        });

        liveProgress.current.set(item.id, 100);
        await updateUploadItem(item.id, { status: "sent", progress: 100, attempts: 0 });
        await refresh();
        return true;
      } catch {
        const attempts = (item.attempts ?? 0) + 1;
        liveProgress.current.set(item.id, 0);
        await updateUploadItem(item.id, {
          status: attempts >= MAX_ATTEMPTS ? "failed" : "queued",
          progress: 0,
          attempts,
          error: attempts >= MAX_ATTEMPTS ? "Envoi impossible" : "Réseau coupé — reprend tout seul",
        });
        await refresh();
        return false;
      }
    },
    [sortieId, refresh, registerOne, paintProgress],
  );

  /** Déclenche le traitement serveur d'une photo déjà envoyée. En arrière-plan :
   *  l'opérateur n'attend pas, les miniatures rattrapent la grille toutes seules. */
  const finalizeOne = useCallback(
    async (item: UploadItem): Promise<boolean> => {
      if (!item.photoId) {
        await updateUploadItem(item.id, { status: "failed", error: "Fiche photo introuvable" });
        await refresh();
        return true;
      }
      try {
        const res = await fetch(`/api/photos/${item.photoId}/complete`, { method: "POST" });
        if (!res.ok) throw new Error("complete failed");
        await updateUploadItem(item.id, { status: "done", progress: 100 });
        await refresh();
        return true;
      } catch {
        const attempts = (item.attempts ?? 0) + 1;
        await updateUploadItem(
          item.id,
          attempts >= MAX_ATTEMPTS
            ? { status: "failed", attempts, error: "Aperçu non généré" }
            : { attempts, error: "Aperçu en attente" },
        );
        await refresh();
        return false;
      }
    },
    [refresh],
  );

  // Deux files qui tournent ensemble : l'une pousse les octets, l'autre
  // ramasse les photos déjà envoyées pour lancer leur traitement. Avant, les
  // deux partageaient les mêmes trois ouvriers et le traitement — le plus lent
  // de loin — bloquait les envois.
  const pump = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    const uploading = new Set<string>();
    const finalizing = new Set<string>();
    let sending = true;

    const uploadWorker = async (): Promise<void> => {
      for (;;) {
        const all = await getUploadItemsForSortie(sortieId);
        const next = all.find((item) => item.status === "queued" && !uploading.has(item.id));
        if (!next) return;
        uploading.add(next.id);
        const ok = await uploadOne(next);
        if (!ok) {
          await sleep(RETRY_DELAY_MS);
          uploading.delete(next.id);
        }
      }
    };

    const finalizeWorker = async (): Promise<void> => {
      for (;;) {
        const all = await getUploadItemsForSortie(sortieId);
        const next = all.find((item) => item.status === "sent" && !finalizing.has(item.id));
        if (!next) {
          if (!sending) return;
          await sleep(400);
          continue;
        }
        finalizing.add(next.id);
        const ok = await finalizeOne(next);
        if (!ok) {
          await sleep(RETRY_DELAY_MS);
          finalizing.delete(next.id);
        }
      }
    };

    try {
      const sends = Promise.all(Array.from({ length: UPLOAD_CONCURRENCY }, () => uploadWorker())).finally(() => {
        sending = false;
      });
      await Promise.all([sends, ...Array.from({ length: FINALIZE_CONCURRENCY }, () => finalizeWorker())]);
    } finally {
      pumpingRef.current = false;
      const all = await refresh();
      // Un dépôt arrivé pendant que la file se vidait : on repart plutôt que
      // d'attendre un rechargement.
      if (all.some((item) => item.status === "queued" || item.status === "sent")) pumpRef.current?.();
      else settledRef.current?.();
    }
  }, [sortieId, refresh, uploadOne, finalizeOne]);

  pumpRef.current = () => void pump();

  const requeueFailed = useCallback(async () => {
    const all = await getUploadItemsForSortie(sortieId);
    const failed = all.filter((item) => item.status === "failed");
    if (failed.length === 0) return;
    await Promise.all(failed.map((item) => updateUploadItem(item.id, { status: "queued", progress: 0, attempts: 0, error: undefined })));
    await refresh();
    void pump();
  }, [sortieId, refresh, pump]);

  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = {
      open: () => inputRef.current?.click(),
      retryFailed: () => void requeueFailed(),
      sync: () => void refresh(),
    };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef, requeueFailed, refresh]);

  useEffect(() => {
    void (async () => {
      // Les envois terminés n'ont plus rien à faire dans la file : sans ce
      // ménage elle grossit à chaque sortie, garde les fichiers d'origine en
      // mémoire, et compte de vieilles photos dans l'avancement du jour.
      await purgeFinishedForSortie(sortieId);
      let all = await refresh();
      if (all.length === 0) return;

      // Un envoi interrompu — onglet fermé, rechargement, navigation — laisse
      // des éléments en "uploading". La file ne réclame que "queued" : personne
      // ne les reprenait, et l'avancement restait figé à « 0 sur 6 » pour
      // toujours. On les remet dans la file.
      const stalled = all.filter((i) => i.status === "uploading" || i.status === "error");
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
      // Reprise : des fichiers déposés avant un rechargement de page reprennent
      // leur envoi, et ceux qui n'attendaient plus que leur traitement aussi.
      if (all.some((i) => i.status === "queued" || i.status === "sent")) void pump();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    // Le dépôt précédent est soldé : on repart d'un compteur qui ne parle que
    // des photos qu'on vient de choisir.
    await purgeFinishedForSortie(sortieId);
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      sortieId,
      file,
      filename: file.name,
      status: "queued",
      progress: 0,
      attempts: 0,
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
    void pump();
  }

  const live = items.filter((i) => i.status !== "failed");
  const total = live.length;
  const sent = live.filter((i) => i.status === "sent" || i.status === "done").length;
  const finalizingCount = live.filter((i) => i.status === "sent").length;
  const failed = items.length - live.length;
  const totalBytes = live.reduce((sum, i) => sum + i.file.size, 0);
  const sentBytes = live.reduce((sum, i) => {
    if (i.status === "queued") return sum;
    if (i.status === "uploading") return sum + (i.file.size * Math.min(100, Math.max(0, i.progress))) / 100;
    return sum + i.file.size;
  }, 0);
  const ratio = totalBytes > 0 ? Math.min(1, sentBytes / totalBytes) : 0;

  useEffect(() => {
    if (!onProgress) return;
    onProgress({
      sent,
      total,
      ratio,
      finalizing: finalizingCount,
      failed,
      pending: items.filter((i) => i.status !== "done" && i.photoId).map((i) => i.photoId as string),
    });
    // `items` porte déjà l'avancement ; `onProgress` est stable côté appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sent, total, ratio, finalizingCount, failed]);

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
