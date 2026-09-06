"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";
import {
  addUploadItem,
  deleteUploadItemsByPhotoIds,
  getAllUploadItems,
  purgeFinished,
  purgeFinishedForSortie,
  updateUploadItem,
  type UploadItem,
} from "@/lib/idb";

/**
 * La file d'envoi des photos, montée une fois pour tout l'espace opérateur.
 *
 * Elle vivait dans l'écran de la sortie : quitter l'écran arrêtait l'envoi, et
 * le moindre remontage du composant cassait la file. Ici le dépôt est
 * instantané pour l'opérateur — ses photos s'affichent, il publie, il repart
 * ailleurs — et le transfert continue en tâche de fond tant que l'onglet est
 * ouvert. C'est le navigateur qui envoie : fermer l'onglet met en pause, la
 * file reprend d'elle-même au retour (rien n'est perdu, tout est dans
 * IndexedDB).
 */

const UPLOAD_CONCURRENCY = 3;
const FINALIZE_CONCURRENCY = 2;
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 2500;
const PAINT_INTERVAL_MS = 120;
const INTENTS_KEY = "linktrip-publications-programmees";

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

/** Une publication demandée avant la fin du transfert : elle part toute seule
 *  dès que la dernière photo de la sortie est prête. */
export interface PublishIntent {
  sortieId: string;
  isGroup: boolean;
  clients: number;
  requestedAt: number;
}

function readIntents(): Record<string, PublishIntent> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(INTENTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PublishIntent>) : {};
  } catch {
    return {};
  }
}

function writeIntents(intents: Record<string, PublishIntent>): void {
  try {
    window.localStorage.setItem(INTENTS_KEY, JSON.stringify(intents));
  } catch {
    // Stockage indisponible (navigation privée) : la publication programmée
    // ne survivra pas au rechargement, le reste fonctionne.
  }
}

export interface SortieUpload {
  /** Photos du transfert en cours pour cette sortie (échecs exclus). */
  total: number;
  /** Photos dont les octets sont arrivés. */
  sent: number;
  /** Photos entièrement prêtes (aperçus générés). */
  done: number;
  /** Photos envoyées dont l'aperçu se prépare encore côté serveur. */
  finalizing: number;
  failed: number;
  /** Avancement en octets, 0 → 1. */
  ratio: number;
  /** Il reste quelque chose à faire pour cette sortie. */
  working: boolean;
  /** Les éléments de la file, pour afficher les vignettes locales tout de suite. */
  items: UploadItem[];
  /** Fiches photo dont l'image n'est pas encore prête côté serveur. */
  pending: Set<string>;
}

const EMPTY: SortieUpload = {
  total: 0,
  sent: 0,
  done: 0,
  finalizing: 0,
  failed: 0,
  ratio: 0,
  working: false,
  items: [],
  pending: new Set(),
};

interface UploadQueueValue {
  forSortie: (sortieId: string) => SortieUpload;
  /** Aperçu local d'un fichier en attente, tiré du fichier déjà sur l'appareil. */
  previewUrl: (itemId: string) => string | undefined;
  enqueue: (sortieId: string, files: File[]) => Promise<void>;
  retryFailed: (sortieId: string) => void;
  /** Après une suppression de photos : elles ne doivent plus peser dans la file. */
  forgetPhotos: (sortieId: string, photoIds: string[]) => Promise<void>;
  schedulePublish: (intent: PublishIntent) => void;
  cancelPublish: (sortieId: string) => void;
  scheduledFor: (sortieId: string) => PublishIntent | null;
}

const UploadQueueContext = createContext<UploadQueueValue | null>(null);

export function useUploadQueue(): UploadQueueValue {
  const value = useContext(UploadQueueContext);
  if (!value) throw new Error("useUploadQueue doit être utilisé dans UploadQueueProvider");
  return value;
}

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [items, setItems] = useState<UploadItem[]>([]);
  const [intents, setIntents] = useState<Record<string, PublishIntent>>({});

  /** L'avancement d'un envoi en cours vit en mémoire, jamais dans IndexedDB :
   *  y écrire à chaque paquet d'octets réécrivait le fichier entier (plusieurs
   *  mégaoctets) des dizaines de fois par seconde, et la page se figeait. */
  const liveProgress = useRef<Map<string, number>>(new Map());
  const previews = useRef<Map<string, string>>(new Map());
  /** Les photos qu'on vient de choisir, affichées avant d'être recopiées dans
   *  IndexedDB — sans ça, une relecture de la file pendant la copie les ferait
   *  disparaître de la grille. */
  const optimistic = useRef<Map<string, UploadItem>>(new Map());
  const paintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pumpingRef = useRef(false);
  const pumpRef = useRef<(() => void) | null>(null);
  const publishRef = useRef<(() => void) | null>(null);

  const applyItems = useCallback((stored: UploadItem[]): UploadItem[] => {
    const storedIds = new Set(stored.map((i) => i.id));
    const waiting = Array.from(optimistic.current.values()).filter((i) => !storedIds.has(i.id));
    const all = waiting.length === 0 ? stored : [...stored, ...waiting].sort((a, b) => a.createdAt - b.createdAt);
    const seen = new Set<string>();
    for (const item of all) {
      seen.add(item.id);
      if (!previews.current.has(item.id)) previews.current.set(item.id, URL.createObjectURL(item.file));
    }
    previews.current.forEach((url, id) => {
      if (!seen.has(id)) {
        URL.revokeObjectURL(url);
        previews.current.delete(id);
      }
    });
    const merged = all.map((item) => {
      const live = liveProgress.current.get(item.id);
      return live === undefined ? item : { ...item, progress: live };
    });
    setItems(merged);
    return merged;
  }, []);

  const refresh = useCallback(async (): Promise<UploadItem[]> => applyItems(await getAllUploadItems()), [applyItems]);

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
    const urls = previews.current;
    return () => {
      if (paintTimer.current) clearTimeout(paintTimer.current);
      urls.forEach((url) => URL.revokeObjectURL(url));
      // Vidée aussi : sinon un remontage (le double montage de React en
      // développement) retrouverait des URL déjà révoquées et n'afficherait
      // plus aucune vignette locale.
      urls.clear();
    };
  }, []);

  // Étape rapide, séparée de l'envoi du fichier : crée la fiche photo côté
  // serveur (pour connaître le total exact tout de suite) sans attendre que
  // les octets du fichier soient envoyés.
  const registerOne = useCallback(async (item: UploadItem): Promise<void> => {
    if (item.photoId && item.signedUrl) return;
    try {
      const res = await fetch(`/api/sorties/${item.sortieId}/photos`, {
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
  }, []);

  /** Envoi des octets seulement. Se termine en "sent" : le traitement serveur
   *  (miniature, filigrane — plusieurs secondes de calcul par photo) n'est pas
   *  attendu ici, il occupait sinon un envoi sur trois pendant tout ce temps. */
  const uploadOne = useCallback(
    async (item: UploadItem): Promise<boolean> => {
      liveProgress.current.set(item.id, 0);
      await updateUploadItem(item.id, { status: "uploading", progress: 0, error: undefined });
      await refresh();
      try {
        await registerOne(item);
        const fresh = (await getAllUploadItems()).find((i) => i.id === item.id);
        const photoId = fresh?.photoId;
        const signedUrl = fresh?.signedUrl;
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
    [refresh, registerOne, paintProgress],
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

  // Deux files qui tournent ensemble, toutes sorties confondues : l'une pousse
  // les octets, l'autre ramasse les photos déjà envoyées pour lancer leur
  // traitement. Avant, les deux partageaient les mêmes trois ouvriers et le
  // traitement — le plus lent de loin — bloquait les envois.
  const pump = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    const uploading = new Set<string>();
    const finalizing = new Set<string>();
    let sending = true;

    const uploadWorker = async (): Promise<void> => {
      for (;;) {
        const all = await getAllUploadItems();
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
        const all = await getAllUploadItems();
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
      else {
        router.refresh();
        publishRef.current?.();
      }
    }
  }, [refresh, uploadOne, finalizeOne, router]);

  pumpRef.current = () => void pump();

  /** Les publications demandées avant la fin du transfert partent ici, dès que
   *  la sortie n'a plus rien en vol. */
  const runScheduledPublishes = useCallback(async () => {
    const stored = readIntents();
    const sortieIds = Object.keys(stored);
    if (sortieIds.length === 0) return;
    const all = await getAllUploadItems();
    for (const sortieId of sortieIds) {
      const intent = stored[sortieId];
      if (!intent) continue;
      const remaining = all.filter((item) => item.sortieId === sortieId && item.status !== "done" && item.status !== "failed");
      if (remaining.length > 0) continue;

      // Retirée avant l'appel : en cas d'échec on le dit et on laisse la main,
      // plutôt que de rejouer une publication en boucle.
      const next = readIntents();
      delete next[sortieId];
      writeIntents(next);
      setIntents(next);

      try {
        const endpoint = intent.isGroup ? `/api/sorties/${sortieId}/publish` : `/api/sorties/${sortieId}/send`;
        const res = await fetch(endpoint, { method: "POST" });
        if (!res.ok) throw new Error("publish failed");
        toast(intent.isGroup ? "Galerie publiée" : `Envoyé à ${intent.clients} client${intent.clients > 1 ? "s" : ""}`);
      } catch {
        toast("La publication programmée n'est pas partie — relancez-la depuis la sortie.");
      }
      router.refresh();
    }
  }, [router, toast]);

  publishRef.current = () => void runScheduledPublishes();

  useEffect(() => {
    void (async () => {
      setIntents(readIntents());
      // Les envois terminés n'ont plus rien à faire dans la file : sans ce
      // ménage elle grossit à chaque sortie et garde les fichiers d'origine en
      // mémoire, plusieurs mégaoctets chacun.
      await purgeFinished();
      let all = await refresh();
      if (all.length > 0) {
        // Un envoi interrompu — onglet fermé, rechargement — laisse des
        // éléments en "uploading" que personne ne réclame. On les remet en file.
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
        if (all.some((i) => i.status === "queued" || i.status === "sent")) {
          void pump();
          return;
        }
      }
      void runScheduledPublishes();
    })();
    // Une seule fois, au montage de l'espace opérateur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // C'est le navigateur qui envoie : fermer l'onglet met le transfert en pause.
  // On prévient plutôt que de laisser un opérateur partir en croyant ses photos
  // parties (elles repartiront à sa prochaine visite, mais il doit le savoir).
  useEffect(() => {
    const inFlight = items.some((i) => i.status === "queued" || i.status === "uploading" || i.status === "sent");
    if (!inFlight) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [items]);

  const enqueue = useCallback(
    async (sortieId: string, files: File[]): Promise<void> => {
      if (files.length === 0) return;
      // Le dépôt précédent est soldé : le compteur ne parle que des photos
      // qu'on vient de choisir.
      await purgeFinishedForSortie(sortieId);
      const created: UploadItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        sortieId,
        file,
        filename: file.name,
        status: "queued",
        progress: 0,
        attempts: 0,
        createdAt: Date.now(),
      }));

      // Les vignettes apparaissent ici, avant le moindre appel réseau et avant
      // même l'écriture dans IndexedDB : vider une carte mémoire, c'est
      // plusieurs centaines de mégaoctets à recopier sur le disque, et
      // l'opérateur n'a pas à regarder un écran vide pendant ce temps.
      for (const item of created) optimistic.current.set(item.id, item);
      await refresh();

      let started = false;
      for (const item of created) {
        await addUploadItem(item);
        optimistic.current.delete(item.id);
        // L'envoi démarre dès la première photo écrite, sans attendre que tout
        // le lot soit recopié.
        if (!started) {
          started = true;
          void pump();
        }
      }
      await refresh();
      // Les fiches côté serveur suivent (léger, rapide) : elles donnent le
      // total exact et les identifiants des photos.
      await Promise.all(created.map((item) => registerOne(item)));
      await refresh();
      router.refresh();
    },
    [refresh, registerOne, pump, router],
  );

  const retryFailed = useCallback(
    (sortieId: string) => {
      void (async () => {
        const all = await getAllUploadItems();
        const failed = all.filter((item) => item.sortieId === sortieId && item.status === "failed");
        if (failed.length === 0) return;
        await Promise.all(
          failed.map((item) => updateUploadItem(item.id, { status: "queued", progress: 0, attempts: 0, error: undefined })),
        );
        await refresh();
        void pump();
      })();
    },
    [refresh, pump],
  );

  const forgetPhotos = useCallback(
    async (sortieId: string, photoIds: string[]): Promise<void> => {
      await deleteUploadItemsByPhotoIds(sortieId, photoIds);
      await refresh();
    },
    [refresh],
  );

  const schedulePublish = useCallback((intent: PublishIntent) => {
    const next = { ...readIntents(), [intent.sortieId]: intent };
    writeIntents(next);
    setIntents(next);
  }, []);

  const cancelPublish = useCallback((sortieId: string) => {
    const next = readIntents();
    delete next[sortieId];
    writeIntents(next);
    setIntents(next);
  }, []);

  const scheduledFor = useCallback((sortieId: string) => intents[sortieId] ?? null, [intents]);

  const forSortie = useCallback(
    (sortieId: string): SortieUpload => {
      const mine = items.filter((i) => i.sortieId === sortieId);
      if (mine.length === 0) return EMPTY;
      const live = mine.filter((i) => i.status !== "failed");
      const totalBytes = live.reduce((sum, i) => sum + i.file.size, 0);
      const sentBytes = live.reduce((sum, i) => {
        if (i.status === "queued") return sum;
        if (i.status === "uploading") return sum + (i.file.size * Math.min(100, Math.max(0, i.progress))) / 100;
        return sum + i.file.size;
      }, 0);
      const done = live.filter((i) => i.status === "done").length;
      return {
        total: live.length,
        sent: live.filter((i) => i.status === "sent" || i.status === "done").length,
        done,
        finalizing: live.filter((i) => i.status === "sent").length,
        failed: mine.length - live.length,
        ratio: totalBytes > 0 ? Math.min(1, sentBytes / totalBytes) : 0,
        working: done < live.length,
        items: mine,
        pending: new Set(mine.filter((i) => i.status !== "done" && i.photoId).map((i) => i.photoId as string)),
      };
    },
    [items],
  );

  const previewUrl = useCallback((itemId: string) => previews.current.get(itemId), []);

  const value = useMemo<UploadQueueValue>(
    () => ({ forSortie, previewUrl, enqueue, retryFailed, forgetPhotos, schedulePublish, cancelPublish, scheduledFor }),
    [forSortie, previewUrl, enqueue, retryFailed, forgetPhotos, schedulePublish, cancelPublish, scheduledFor],
  );

  // L'indicateur ne s'affiche que loin de l'écran concerné : sur la sortie
  // elle-même, la barre basse dit déjà tout.
  const elsewhere = items.filter((i) => i.status !== "failed" && !pathname.endsWith(`/sorties/${i.sortieId}`));
  const remaining = elsewhere.filter((i) => i.status !== "done").length;
  const elsewhereBytes = elsewhere.reduce((sum, i) => sum + i.file.size, 0);
  const elsewhereSent = elsewhere.reduce((sum, i) => {
    if (i.status === "queued") return sum;
    if (i.status === "uploading") return sum + (i.file.size * Math.min(100, Math.max(0, i.progress))) / 100;
    return sum + i.file.size;
  }, 0);
  const pct = elsewhereBytes > 0 ? Math.round((elsewhereSent / elsewhereBytes) * 100) : 0;

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
      {remaining > 0 ? (
        <div className={styles.upPill} role="status" aria-live="polite">
          <span className={styles.upPillText}>
            <b>
              {remaining} photo{remaining > 1 ? "s" : ""}
            </b>{" "}
            en cours d&rsquo;envoi
          </span>
          <span className={styles.upPillBar}>
            <span className={styles.upPillFill} style={{ width: `${pct}%` }} />
          </span>
        </div>
      ) : null}
    </UploadQueueContext.Provider>
  );
}
