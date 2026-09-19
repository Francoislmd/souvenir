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
import { runPublication } from "@/lib/publish-client";

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
  /** Mode GROUPE : les adresses collées avant la publication, envoyées avec elle. */
  emails?: string[];
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
  failed: number;
  /** Il reste quelque chose à faire pour cette sortie. */
  working: boolean;
  /** Les éléments de la file, pour afficher les vignettes locales tout de suite. */
  items: UploadItem[];
}

/**
 * Une publication en cours, racontée étape par étape par le serveur (flux
 * NDJSON, lib/progress-stream.ts). Elle vit ici et non dans l'écran de la
 * sortie : l'opérateur peut aller ailleurs dans son espace, elle continue, et
 * l'écran qui revient la retrouve où elle en est.
 */
export interface PublicationRun {
  isGroup: boolean;
  /** running : photos en préparation (GROUPE) ou e-mails en cours (INDIVIDUEL).
   *  done : le serveur a fini, on attend que la page relue dise « publiée ». */
  phase: "running" | "sorting" | "inviting" | "done" | "failed";
  /** Photos préparées (GROUPE) ou clients servis (INDIVIDUEL). */
  done: number;
  total: number;
  /** Les photos dont l'aperçu filigrané est posé : elles s'allument dans la grille. */
  readyIds: string[];
  /** Adresses collées auxquelles le lien part dans la foulée (GROUPE). */
  invites: number;
  /** La publication a d'abord attendu la fin du transfert. */
  afterTransfer: boolean;
}

const EMPTY: SortieUpload = {
  failed: 0,
  working: false,
  items: [],
};

interface UploadQueueValue {
  forSortie: (sortieId: string) => SortieUpload;
  /** Aperçu local d'un fichier en attente, tiré du fichier déjà sur l'appareil. */
  previewUrl: (itemId: string) => string | undefined;
  enqueue: (sortieId: string, files: File[]) => Promise<void>;
  retryFailed: (sortieId: string) => void;
  /** Après une suppression de photos : elles ne doivent plus peser dans la file. */
  forgetPhotos: (sortieId: string, photoIds: string[]) => Promise<void>;
  /** Publier : tout de suite si la sortie n'a plus rien en vol, sinon dès
   *  que la dernière photo est prête. */
  publish: (intent: PublishIntent) => void;
  cancelPublish: (sortieId: string) => void;
  scheduledFor: (sortieId: string) => PublishIntent | null;
  publicationFor: (sortieId: string) => PublicationRun | null;
  /** L'écran a pris acte de l'issue (galerie affichée en ligne, ou échec relancé). */
  dismissPublication: (sortieId: string) => void;
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
  const [runs, setRuns] = useState<Record<string, PublicationRun>>({});
  /** Verrou synchrone : deux déclencheurs (fin de file + montage) ne doivent
   *  jamais lancer deux fois la même publication. */
  const running = useRef<Set<string>>(new Set());

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
  /** `enqueue` enregistre chaque photo côté serveur dès le dépôt (pour un
   *  total exact tout de suite), et `pump` le refait au moment de l'envoi si
   *  ce n'est pas déjà fait : sans ce verrou les deux appels concurrents
   *  passaient chacun le test « pas encore enregistrée » sur un instantané
   *  périmé de l'item, et créaient chacun leur fiche photo — l'une des deux
   *  ne recevait jamais ses octets et restait une case vide pour toujours. */
  const registering = useRef<Set<string>>(new Set());
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
    if (registering.current.has(item.id)) return;
    registering.current.add(item.id);
    try {
      // Relire l'état courant plutôt que de faire confiance à `item` : un
      // appel concurrent a pu l'enregistrer entre-temps.
      const current = (await getAllUploadItems()).find((i) => i.id === item.id);
      if (current?.photoId && current?.signedUrl) return;
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
    } finally {
      registering.current.delete(item.id);
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

  const patchRun = useCallback((sortieId: string, patch: Partial<PublicationRun> | ((run: PublicationRun) => Partial<PublicationRun>)) => {
    setRuns((prev) => {
      const run = prev[sortieId];
      if (!run) return prev;
      return { ...prev, [sortieId]: { ...run, ...(typeof patch === "function" ? patch(run) : patch) } };
    });
  }, []);

  /** Une publication, du premier appel au dernier e-mail. L'état « en cours »
   *  est posé AVANT que l'intention programmée ne soit effacée : sinon l'écran
   *  voyait un instant « plus rien de programmé, rien en cours » et
   *  réaffichait la grille non publiée pendant toute la préparation. */
  const startRun = useCallback(
    async (intent: PublishIntent, afterTransfer: boolean) => {
      const { sortieId } = intent;
      if (running.current.has(sortieId)) return;
      running.current.add(sortieId);
      const invites = intent.isGroup ? (intent.emails?.length ?? 0) : 0;
      setRuns((prev) => ({
        ...prev,
        [sortieId]: { isGroup: intent.isGroup, phase: "running", done: 0, total: 0, readyIds: [], invites, afterTransfer },
      }));
      const stored = readIntents();
      if (stored[sortieId]) {
        delete stored[sortieId];
        writeIntents(stored);
        setIntents(stored);
      }

      let ok = false;
      try {
        ok = await runPublication(sortieId, intent.isGroup, (event) => {
          if (event.t === "start") patchRun(sortieId, { total: event.total });
          else if (event.t === "photo")
            patchRun(sortieId, (run) => ({ done: event.done, total: event.total, readyIds: [...run.readyIds, event.id] }));
          else if (event.t === "client") patchRun(sortieId, { done: event.done, total: event.total });
          else if (event.t === "sorting") patchRun(sortieId, { phase: "sorting" });
        });
      } catch {
        ok = false;
      }

      if (!ok) {
        running.current.delete(sortieId);
        patchRun(sortieId, { phase: "failed" });
        toast(intent.isGroup ? "La publication n'a pas abouti — réessayez." : "L'envoi n'a pas abouti — réessayez.");
        return;
      }

      // Le lien part dans la foulée, aux adresses collées avant la publication.
      // Un envoi raté ne remet pas la publication en question : elle a eu
      // lieu, et l'écran de la sortie permet de renvoyer.
      let invitedOk = true;
      if (invites > 0) {
        patchRun(sortieId, { phase: "inviting" });
        try {
          const sent = await fetch(`/api/sorties/${sortieId}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emails: intent.emails }),
          });
          invitedOk = sent.ok;
        } catch {
          invitedOk = false;
        }
      }

      running.current.delete(sortieId);
      patchRun(sortieId, { phase: "done" });
      toast(
        intent.isGroup
          ? invites === 0
            ? "Galerie publiée"
            : invitedOk
              ? `Galerie publiée, lien envoyé à ${invites} client${invites > 1 ? "s" : ""}`
              : "Galerie publiée, mais l'envoi du lien a échoué"
          : `Envoyé à ${intent.clients} client${intent.clients > 1 ? "s" : ""}`,
      );
      // L'écran garde l'avancement affiché jusqu'à ce que la page relue
      // dise « publiée » : il n'y a plus de retour sur la grille entre-temps.
      router.refresh();
    },
    [patchRun, router, toast],
  );

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
      void startRun(intent, true);
    }
  }, [startRun]);

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
    // Une publication en cours compte aussi : fermer l'onglet coupe le récit
    // de l'avancement, et l'invitation par e-mail qui la suit ne partirait pas.
    const inFlight =
      items.some((i) => i.status === "queued" || i.status === "uploading" || i.status === "sent") ||
      Object.values(runs).some((r) => r.phase === "running" || r.phase === "sorting" || r.phase === "inviting");
    if (!inFlight) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [items, runs]);

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

  const publish = useCallback(
    (intent: PublishIntent) => {
      const busy = items.some((i) => i.sortieId === intent.sortieId && i.status !== "done" && i.status !== "failed");
      if (!busy) {
        void startRun(intent, false);
        return;
      }
      const next = { ...readIntents(), [intent.sortieId]: intent };
      writeIntents(next);
      setIntents(next);
    },
    [items, startRun],
  );

  const publicationFor = useCallback((sortieId: string) => runs[sortieId] ?? null, [runs]);

  const dismissPublication = useCallback((sortieId: string) => {
    setRuns((prev) => {
      if (!prev[sortieId]) return prev;
      const next = { ...prev };
      delete next[sortieId];
      return next;
    });
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
      const done = live.filter((i) => i.status === "done").length;
      return {
        failed: mine.length - live.length,
        working: done < live.length,
        items: mine,
      };
    },
    [items],
  );

  const previewUrl = useCallback((itemId: string) => previews.current.get(itemId), []);

  const value = useMemo<UploadQueueValue>(
    () => ({ forSortie, previewUrl, enqueue, retryFailed, forgetPhotos, publish, cancelPublish, scheduledFor, publicationFor, dismissPublication }),
    [forSortie, previewUrl, enqueue, retryFailed, forgetPhotos, publish, cancelPublish, scheduledFor, publicationFor, dismissPublication],
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
  // Une publication lancée puis laissée derrière soi se voit aussi ailleurs.
  const publishingElsewhere = Object.entries(runs).find(
    ([sortieId, run]) => (run.phase === "running" || run.phase === "sorting" || run.phase === "inviting") && !pathname.endsWith(`/sorties/${sortieId}`),
  )?.[1];

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
      {remaining === 0 && publishingElsewhere ? (
        <div className={styles.upPill} role="status" aria-live="polite">
          <span className={styles.upPillText}>
            <b>{publishingElsewhere.isGroup ? "Publication" : "Envoi"}</b> en cours
            {publishingElsewhere.total > 0 ? ` · ${publishingElsewhere.done} / ${publishingElsewhere.total}` : "…"}
          </span>
          <span className={styles.upPillBar}>
            <span
              className={styles.upPillFill}
              style={{ width: `${publishingElsewhere.total > 0 ? Math.max(4, Math.round((publishingElsewhere.done / publishingElsewhere.total) * 100)) : 4}%` }}
            />
          </span>
        </div>
      ) : null}
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
