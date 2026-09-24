"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";
import { addItem, deleteItems, getBlob, loadItems, putBlob, saveItem, type BlobKind, type UploadItem } from "@/lib/idb";
import { runPublication } from "@/lib/publish-client";
import { MAX_VIDEO_BYTES, MAX_VIDEO_MB, isVideoFile } from "@/lib/media";
import { probeVideo } from "@/lib/video-probe";
import { makeFastCopy, quickThumb } from "@/lib/fast-copy";

/**
 * La file d'envoi des photos, montée une fois pour tout l'espace opérateur.
 *
 * Le dépôt est instantané pour l'opérateur : ses photos s'affichent, il
 * publie, il repart ailleurs, et le transfert continue en tâche de fond tant
 * que l'onglet est ouvert. Fermer l'onglet met en pause ; la file reprend au
 * retour (tout est dans IndexedDB, lib/idb.ts).
 *
 * Refondue le 24/09/2026 après un test instrumenté en production (20 photos,
 * chaque case de la grille relevée toutes les 50 ms) :
 * - l'état fait foi EN MÉMOIRE, et une seule fois. Avant, chaque ouvrier
 *   relisait toute la file dans IndexedDB en boucle, décidait sur un
 *   instantané périmé, et chaque changement d'état réécrivait le fichier
 *   d'origine (plusieurs Mo). IndexedDB n'est plus qu'une sauvegarde ;
 * - le travail est découpé en étapes explicites, relancées par `kick()` à
 *   chaque changement (plus d'ouvriers qui tournent en attendant) :
 *   préparer (copie de travail + vignette locale) → enregistrer (par lots,
 *   une requête pour toutes les photos prêtes) → envoyer la copie → faire
 *   traiter par le serveur → l'original en tâche de fond ;
 * - les éléments d'une sortie supprimée, d'un autre compte ou d'une photo
 *   effacée sont retirés au démarrage. 38 photos de juillet, aux URL
 *   d'envoi expirées, passaient devant chaque nouveau dépôt : les photos du
 *   test ne sont parties qu'au bout de 35 s ;
 * - une URL d'envoi de plus de 5 h, ou refusée par le stockage, est
 *   redemandée (/api/photos/[photoId]/upload) au lieu d'échouer quatre fois.
 *
 * Deux temps depuis le 23/09/2026 : la copie de travail 2048 px rend la
 * photo publiable (statut `background`), l'original suit sans rien bloquer.
 * Une vidéo suit le même chemin : sa vignette d'abord, la vidéo ensuite.
 */

const PREPARE_CONCURRENCY = 2;
const QUICK_THUMB_CONCURRENCY = 3;
const UPLOAD_CONCURRENCY = 3;
// Le traitement serveur d'une copie de travail prend une à deux secondes ;
// chaque appel est une fonction Vercel à part, six à la fois ne se gênent pas.
const FINALIZE_CONCURRENCY = 6;
const HD_CONCURRENCY = 2;
const REGISTER_BATCH = 25;
const MAX_ATTEMPTS = 4;
/** Les URL d'envoi valent 6 h (lib/storage.ts) : au-delà de 5, on en redemande. */
const URL_TTL_MS = 5 * 60 * 60 * 1000;
/** Un élément plus vieux que ça n'a plus rien à faire sur l'appareil. */
const STALE_MS = 30 * 24 * 60 * 60 * 1000;
const PAINT_INTERVAL_MS = 100;
const INTENTS_KEY = "linktrip-publications-programmees";
const TOO_LARGE = `Fichier trop lourd (vidéo : ${MAX_VIDEO_MB} Mo max)`;
const STORAGE_FULL = "Espace de stockage plein";

function backoff(attempts: number): number {
  return Math.min(60_000, 1500 * 2 ** Math.max(0, attempts - 1));
}

/** La photo a une seconde phase : sa copie de travail (ou la vignette d'une
 *  vidéo) part d'abord, l'original ensuite. */
function hasSecondPhase(item: UploadItem): boolean {
  return item.hdLater ?? (Boolean(item.isVideo) || Boolean(item.workSize));
}

/** Octets de la première phase, ceux qu'il faut attendre avant de publier.
 *  Avant la copie de travail, une estimation : la barre ne doit pas partir
 *  sur la taille des originaux pour s'effondrer ensuite. */
export function phaseOneBytes(item: UploadItem): number {
  if (item.isVideo) return item.posterSize ?? 0;
  if (!item.prepared && !item.photoId) return item.size >= 900 * 1024 ? Math.min(item.size, 600 * 1024) : item.size;
  return hasSecondPhase(item) ? (item.workSize ?? 0) : item.size;
}

/** La photo ne retient plus la publication : prête, ou abandonnée. */
function isSettled(item: UploadItem): boolean {
  return item.status === "done" || item.status === "background" || item.status === "failed";
}

function isPhaseOne(item: UploadItem): boolean {
  return item.status === "queued" || item.status === "uploading" || item.status === "sent";
}

class HttpError extends Error {
  constructor(public readonly status: number) {
    super(`status ${status}`);
  }
}

function putToSignedUrl(url: string, file: Blob, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new HttpError(xhr.status)));
    xhr.onerror = () => reject(new HttpError(0));
    xhr.ontimeout = () => reject(new HttpError(0));
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
  /** Il reste à rendre des photos publiables (première phase). */
  working: boolean;
  /** Originaux encore en route, sortie déjà publiable (seconde phase). */
  hdRemaining: number;
  /** Photos déposées ici qui n'ont pas encore de fiche côté serveur. */
  unregistered: number;
  /** Tous les éléments de la sortie sur cet appareil, dans l'ordre du dépôt. */
  items: UploadItem[];
  /** Le ou les dépôts pas encore soldés : ce dont parle l'avancement. */
  current: UploadItem[];
}

/** L'image locale d'un élément : sa vignette dès qu'elle existe, le fichier
 *  en attendant (une vidéo se montre par un lecteur, pas une image). */
export interface LocalPreview {
  url: string;
  video: boolean;
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

const EMPTY: SortieUpload = { failed: 0, working: false, hdRemaining: 0, unregistered: 0, items: [], current: [] };

interface UploadQueueValue {
  forSortie: (sortieId: string) => SortieUpload;
  /** Aperçu local d'un élément, tiré du fichier déjà sur l'appareil. */
  preview: (itemId: string) => LocalPreview | undefined;
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

type Blobs = Partial<Record<BlobKind, Blob>>;

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [items, setItems] = useState<UploadItem[]>([]);
  const [intents, setIntents] = useState<Record<string, PublishIntent>>({});
  const [runs, setRuns] = useState<Record<string, PublicationRun>>({});
  /** Verrou synchrone : deux déclencheurs ne lancent jamais deux fois la même publication. */
  const running = useRef<Set<string>>(new Set());

  // ---- L'état, en mémoire -------------------------------------------------

  /** La seule vérité sur la file. L'écran en reçoit une copie repeinte au
   *  plus toutes les 100 ms ; IndexedDB en reçoit une sauvegarde. */
  const store = useRef<Map<string, UploadItem>>(new Map());
  /** Les fichiers de chaque élément, gardés sous la main (un File ne coûte
   *  qu'une référence au fichier sur le disque). */
  const blobs = useRef<Map<string, Blobs>>(new Map());
  /** Vignette locale de chaque élément, par ordre de qualité : 0 le fichier,
   *  1 la vignette EXIF embarquée, 2 la vignette faite ici. Une URL remplacée
   *  n'est révoquée qu'après coup : la grille ne change d'image qu'une fois
   *  la nouvelle décodée (SortieScreen, StableImg). */
  const previews = useRef<Map<string, LocalPreview & { rank: number }>>(new Map());
  const paintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPaint = useRef(0);
  /** La file ne démarre qu'une fois les éléments d'avant vérifiés auprès du serveur. */
  const started = useRef(false);

  const paintNow = useCallback(() => {
    if (paintTimer.current) {
      clearTimeout(paintTimer.current);
      paintTimer.current = null;
    }
    lastPaint.current = Date.now();
    setItems(Array.from(store.current.values()).sort((a, b) => a.createdAt - b.createdAt));
  }, []);

  const paint = useCallback(() => {
    if (paintTimer.current) return;
    const wait = Math.max(0, PAINT_INTERVAL_MS - (Date.now() - lastPaint.current));
    paintTimer.current = setTimeout(() => {
      paintTimer.current = null;
      paintNow();
    }, wait);
  }, [paintNow]);

  // Toutes les écritures IndexedDB passent l'une après l'autre : une
  // suppression ne peut pas être doublée par une sauvegarde partie avant elle.
  const ioChain = useRef<Promise<void>>(Promise.resolve());
  const io = useCallback((task: () => Promise<void>) => {
    ioChain.current = ioChain.current.then(task).catch(() => undefined);
  }, []);
  const dirty = useRef<Set<string>>(new Set());
  const persist = useCallback(
    (id: string) => {
      if (dirty.current.has(id)) return;
      dirty.current.add(id);
      io(async () => {
        dirty.current.delete(id);
        const item = store.current.get(id);
        if (item) await saveItem({ ...item, progress: 0 });
      });
    },
    [io],
  );

  const patch = useCallback(
    (id: string, change: Partial<UploadItem>, { save = true }: { save?: boolean } = {}): UploadItem | undefined => {
      const item = store.current.get(id);
      if (!item) return undefined;
      const next = { ...item, ...change };
      store.current.set(id, next);
      if (save) persist(id);
      paint();
      return next;
    },
    [persist, paint],
  );

  const setPreview = useCallback((id: string, blob: Blob, rank: number, video = false) => {
    const current = previews.current.get(id);
    if (current && current.rank >= rank) return;
    previews.current.set(id, { url: URL.createObjectURL(blob), video, rank });
    if (current) setTimeout(() => URL.revokeObjectURL(current.url), 30_000);
  }, []);

  const removeItems = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      for (const id of ids) {
        store.current.delete(id);
        blobs.current.delete(id);
        const preview = previews.current.get(id);
        if (preview) setTimeout(() => URL.revokeObjectURL(preview.url), 30_000);
        previews.current.delete(id);
      }
      io(() => deleteItems(ids));
      paint();
    },
    [io, paint],
  );

  const blobOf = useCallback(async (id: string, kind: BlobKind): Promise<Blob | undefined> => {
    const held = blobs.current.get(id)?.[kind];
    if (held) return held;
    const stored = await getBlob(id, kind).catch(() => undefined);
    if (stored) blobs.current.set(id, { ...blobs.current.get(id), [kind]: stored });
    return stored;
  }, []);

  const keepBlob = useCallback(
    (id: string, kind: BlobKind, blob: Blob) => {
      blobs.current.set(id, { ...blobs.current.get(id), [kind]: blob });
      io(async () => {
        if (store.current.has(id)) await putBlob(id, kind, blob);
      });
    },
    [io],
  );

  useEffect(() => {
    const urls = previews.current;
    return () => {
      if (paintTimer.current) clearTimeout(paintTimer.current);
      urls.forEach((preview) => URL.revokeObjectURL(preview.url));
      // Vidée aussi : un remontage (le double montage de React en
      // développement) retrouverait sinon des URL déjà révoquées.
      urls.clear();
    };
  }, []);

  // Un seul message pour tout un lot refusé, pas un par photo.
  const fullNoticeAt = useRef(0);
  const storageFullNotice = useCallback(() => {
    if (Date.now() - fullNoticeAt.current < 10_000) return;
    fullNoticeAt.current = Date.now();
    toast("Espace de stockage plein : ces fichiers n'ont pas été ajoutés. La place se libère quand les sorties de plus de 90 jours sont supprimées.");
  }, [toast]);

  // ---- Les étapes ---------------------------------------------------------

  const active = useRef({
    prepare: new Set<string>(),
    quick: 0,
    register: false,
    upload: new Set<string>(),
    finalize: new Set<string>(),
    hd: new Set<string>(),
  });
  const kickRef = useRef<() => void>(() => undefined);
  const kick = useCallback(() => kickRef.current(), []);
  /** Vignette EXIF déjà tentée : faite ou impossible, elle ne se retente pas. */
  const quickTried = useRef<Set<string>>(new Set());

  /** Copie de travail, vignette locale et heure (photo), ou vignette, durée
   *  et heure (vidéo). Une fois pour toutes : un rechargement ne refait rien. */
  const prepare = useCallback(
    async (id: string) => {
      const item = store.current.get(id);
      if (!item) return;
      const file = await blobOf(id, "file");
      if (!file) {
        // Le fichier n'est plus sur l'appareil (données du site effacées) :
        // rien à envoyer, l'élément disparaît.
        removeItems([id]);
        return;
      }
      if (item.isVideo) {
        const probe = await probeVideo(file, item.lastModified);
        if (probe.poster) {
          keepBlob(id, "poster", probe.poster);
          setPreview(id, probe.poster, 2);
        }
        patch(id, { probed: true, posterSize: probe.poster?.size ?? null, durationSec: probe.durationSec, takenAt: probe.takenAt });
        return;
      }
      const copy = await makeFastCopy(file);
      if (copy.work) keepBlob(id, "work", copy.work);
      if (copy.thumb) {
        keepBlob(id, "thumb", copy.thumb);
        setPreview(id, copy.thumb, 2);
      }
      patch(id, { prepared: true, workSize: copy.work?.size ?? null, hasThumb: Boolean(copy.thumb), takenAt: copy.takenAt });
    },
    [blobOf, keepBlob, patch, removeItems, setPreview],
  );

  /** Toutes les photos prêtes d'une sortie, enregistrées en une requête. */
  const register = useCallback(
    async (batch: UploadItem[]) => {
      const sortieId = batch[0]!.sortieId;
      let res: Response | null = null;
      try {
        res = await fetch(`/api/sorties/${sortieId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: batch.map((item) =>
              item.isVideo
                ? {
                    filename: item.filename,
                    kind: "video",
                    sizeBytes: item.size,
                    posterBytes: item.posterSize || null,
                    durationSec: item.durationSec ?? null,
                    takenAt: item.takenAt ?? null,
                  }
                : { filename: item.filename, sizeBytes: item.size, posterBytes: item.workSize || null, takenAt: item.takenAt ?? null },
            ),
          }),
        });
      } catch {
        // Réseau coupé : traité comme une réponse illisible, ci-dessous.
      }
      const status = res?.status ?? 0;
      if (status === 404) {
        // La sortie n'existe plus (supprimée ailleurs) : ses photos non plus.
        removeItems(Array.from(store.current.values()).filter((i) => i.sortieId === sortieId).map((i) => i.id));
        return;
      }
      const data = res?.ok
        ? ((await res.json().catch(() => null)) as {
            results?: ({ ok: true; photoId: string; signedUrl: string; posterSignedUrl: string | null; originalPending: boolean } | { ok: false; status: number; error: string })[];
          } | null)
        : null;
      if (!data?.results || data.results.length !== batch.length) {
        for (const item of batch) {
          const attempts = (store.current.get(item.id)?.attempts ?? 0) + 1;
          patch(item.id, {
            attempts,
            retryAt: Date.now() + backoff(attempts),
            ...(attempts >= MAX_ATTEMPTS && status !== 401 ? { status: "failed", error: "Envoi impossible" } : {}),
          });
        }
        return;
      }
      const now = Date.now();
      data.results.forEach((result, index) => {
        const item = batch[index]!;
        if (result.ok) {
          patch(item.id, {
            photoId: result.photoId,
            signedUrl: result.signedUrl,
            posterSignedUrl: result.posterSignedUrl,
            urlsAt: now,
            hdLater: result.originalPending,
            attempts: 0,
            retryAt: undefined,
          });
        } else {
          patch(item.id, { status: "failed", attempts: MAX_ATTEMPTS, error: result.status === 507 ? STORAGE_FULL : TOO_LARGE });
          if (result.status === 507) storageFullNotice();
        }
      });
    },
    [patch, removeItems, storageFullNotice],
  );

  /** URL d'envoi neuves pour une photo déjà enregistrée. `false` : la photo n'existe plus. */
  const refreshUrls = useCallback(
    async (item: UploadItem): Promise<UploadItem | false> => {
      const second = hasSecondPhase(item);
      const posterBytes = second ? (item.isVideo ? item.posterSize : item.workSize) : null;
      const qs = new URLSearchParams({ original: String(item.size) });
      if (posterBytes) qs.set("poster", String(posterBytes));
      const res = await fetch(`/api/photos/${item.photoId}/upload?${qs.toString()}`);
      if (res.status === 404) return false;
      if (!res.ok) throw new HttpError(res.status);
      const data = (await res.json()) as { signedUrl: string; posterSignedUrl: string | null };
      return patch(item.id, { signedUrl: data.signedUrl, posterSignedUrl: data.posterSignedUrl, urlsAt: Date.now() }) ?? false;
    },
    [patch],
  );

  /** Première phase : les octets qui rendent la photo publiable. */
  const upload = useCallback(
    async (id: string) => {
      let item = patch(id, { status: "uploading", progress: 0, error: undefined });
      if (!item) return;
      const onProgress = (pct: number) => patch(id, { progress: pct }, { save: false });
      try {
        if (!item.urlsAt || Date.now() - item.urlsAt > URL_TTL_MS || !item.signedUrl) {
          const fresh = await refreshUrls(item);
          if (!fresh) {
            removeItems([id]);
            return;
          }
          item = fresh;
        }
        if (hasSecondPhase(item)) {
          const light = await blobOf(id, item.isVideo ? "poster" : "work");
          if (light && item.posterSignedUrl && !item.posterSent) {
            await putToSignedUrl(item.posterSignedUrl, light, onProgress);
            patch(id, { posterSent: true });
          }
        } else {
          const file = await blobOf(id, "file");
          if (!file) {
            removeItems([id]);
            return;
          }
          await putToSignedUrl(item.signedUrl!, file, onProgress);
        }
        patch(id, { status: "sent", progress: 100, attempts: 0, retryAt: undefined });
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 0;
        const attempts = (store.current.get(id)?.attempts ?? 0) + 1;
        patch(id, {
          status: attempts >= MAX_ATTEMPTS ? "failed" : "queued",
          progress: 0,
          attempts,
          retryAt: Date.now() + backoff(attempts),
          // Un refus du stockage (URL expirée, signature) : on en redemande une.
          ...(status >= 400 && status < 500 ? { urlsAt: 0 } : {}),
          error: attempts >= MAX_ATTEMPTS ? "Envoi impossible" : "Réseau coupé — reprend tout seul",
        });
      }
    },
    [blobOf, patch, refreshUrls, removeItems],
  );

  /** Le traitement serveur (miniature, aperçus, filigrane) d'une photo arrivée. */
  const finalize = useCallback(
    async (id: string) => {
      const item = store.current.get(id);
      if (!item?.photoId) return;
      try {
        const res = await fetch(`/api/photos/${item.photoId}/complete`, { method: "POST" });
        if (res.status === 404) {
          removeItems([id]);
          return;
        }
        if (!res.ok) throw new HttpError(res.status);
        patch(id, { status: hasSecondPhase(item) ? "background" : "done", progress: 100, attempts: 0, retryAt: undefined, error: undefined });
      } catch {
        const attempts = (store.current.get(id)?.attempts ?? 0) + 1;
        patch(
          id,
          attempts >= MAX_ATTEMPTS
            ? { status: "failed", attempts, error: "Aperçu non généré" }
            : { attempts, retryAt: Date.now() + backoff(attempts), error: "Aperçu en attente" },
        );
      }
    },
    [patch, removeItems],
  );

  /** Seconde phase : l'original. Jamais abandonné — plus rien à l'écran ne
   *  l'attend — mais espacé quand le réseau manque. */
  const uploadOriginal = useCallback(
    async (id: string) => {
      const item = store.current.get(id);
      if (!item?.photoId) return;
      try {
        const file = await blobOf(id, "file");
        if (!file) {
          removeItems([id]);
          return;
        }
        const res = await fetch(`/api/photos/${item.photoId}/original?size=${item.size}`);
        if (res.status === 404) {
          removeItems([id]);
          return;
        }
        if (!res.ok) throw new HttpError(res.status);
        const data = (await res.json()) as { signedUrl?: string; done?: boolean };
        if (!data.done) {
          if (!data.signedUrl) throw new Error("no url");
          await putToSignedUrl(data.signedUrl, file, () => undefined);
          const confirm = await fetch(`/api/photos/${item.photoId}/original`, { method: "POST" });
          if (!confirm.ok) throw new HttpError(confirm.status);
        }
        patch(id, { status: "done", retryAt: undefined, hdAttempts: 0 });
      } catch {
        const hdAttempts = (store.current.get(id)?.hdAttempts ?? 0) + 1;
        patch(id, { hdAttempts, retryAt: Date.now() + Math.min(120_000, 3000 * 2 ** Math.min(hdAttempts, 6)) });
      }
    },
    [blobOf, patch, removeItems],
  );

  /** La vignette embarquée dans l'EXIF, lue sans décoder la photo : la
   *  grille a une image légère en quelques millisecondes, bien avant la
   *  vignette faite à partir de la copie de travail. */
  const quick = useCallback(
    async (id: string) => {
      const file = blobs.current.get(id)?.file;
      if (!file) return;
      const thumb = await quickThumb(file);
      if (thumb && store.current.has(id)) {
        setPreview(id, thumb, 1);
        paint();
      }
    },
    [paint, setPreview],
  );

  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasBusy = useRef(false);
  const publishRef = useRef<() => void>(() => undefined);

  kickRef.current = () => {
    if (!started.current) return;
    const now = Date.now();
    const all = Array.from(store.current.values()).sort((a, b) => a.createdAt - b.createdAt);
    const a = active.current;
    const launch = (set: Set<string>, id: string, task: (id: string) => Promise<void>) => {
      set.add(id);
      void task(id).finally(() => {
        set.delete(id);
        kick();
      });
    };
    const due = (item: UploadItem) => (item.retryAt ?? 0) <= now;

    for (const item of all) {
      if (a.quick >= QUICK_THUMB_CONCURRENCY) break;
      if (!item.isVideo && !item.prepared && !quickTried.current.has(item.id) && !previews.current.get(item.id)?.rank) {
        quickTried.current.add(item.id);
        a.quick += 1;
        void quick(item.id).finally(() => {
          a.quick -= 1;
          kick();
        });
      }
    }
    for (const item of all) {
      if (a.prepare.size >= PREPARE_CONCURRENCY) break;
      const needs = item.status === "queued" && !item.photoId && (item.isVideo ? !item.probed : !item.prepared);
      if (needs && !a.prepare.has(item.id)) launch(a.prepare, item.id, prepare);
    }
    if (!a.register) {
      const ready = all.filter(
        (item) => item.status === "queued" && !item.photoId && (item.isVideo ? item.probed : item.prepared) && due(item),
      );
      if (ready.length > 0) {
        const sortieId = ready[0]!.sortieId;
        const batch = ready.filter((item) => item.sortieId === sortieId).slice(0, REGISTER_BATCH);
        a.register = true;
        void register(batch).finally(() => {
          a.register = false;
          kick();
        });
      }
    }
    for (const item of all) {
      if (a.upload.size >= UPLOAD_CONCURRENCY) break;
      if (item.status === "queued" && item.photoId && due(item) && !a.upload.has(item.id)) launch(a.upload, item.id, upload);
    }
    for (const item of all) {
      if (a.finalize.size >= FINALIZE_CONCURRENCY) break;
      if (item.status === "sent" && due(item) && !a.finalize.has(item.id)) launch(a.finalize, item.id, finalize);
    }
    // Les originaux ne partent que quand plus aucune photo n'attend de
    // devenir publiable : ils ne prennent jamais la bande passante d'une copie.
    const busy = all.some(isPhaseOne);
    if (!busy) {
      for (const item of all) {
        if (a.hd.size >= HD_CONCURRENCY) break;
        if (item.status === "background" && due(item) && !a.hd.has(item.id)) launch(a.hd, item.id, uploadOriginal);
      }
    }

    // La première phase vient de se solder : la page relit ses chiffres
    // (nombre de photos de la liste des sorties), et une publication
    // programmée peut partir.
    if (wasBusy.current && !busy) router.refresh();
    wasBusy.current = busy;
    publishRef.current();

    // Le prochain essai différé.
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
    const waiting = all.filter((item) => (item.status === "queued" || item.status === "sent" || item.status === "background") && !due(item));
    if (waiting.length > 0) {
      const next = Math.min(...waiting.map((item) => item.retryAt ?? now));
      retryTimer.current = setTimeout(kick, Math.max(500, next - now));
    }
  };

  // ---- Démarrage : relire la file, écarter ce qui n'a plus lieu d'être ----

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIntents(readIntents());
      let stored: UploadItem[] = [];
      try {
        stored = await loadItems();
      } catch {
        // IndexedDB indisponible (navigation privée sur un vieux Safari) :
        // la file vit en mémoire, le reste fonctionne.
      }
      if (cancelled) return;
      const now = Date.now();
      const drop = new Set<string>();
      for (const item of stored) {
        if (item.status === "done" || now - item.createdAt > STALE_MS) drop.add(item.id);
      }
      // Chaque sortie est vérifiée auprès du serveur : une sortie supprimée,
      // ou celle d'un autre compte ouvert un jour dans ce navigateur, n'a
      // rien à faire dans la file.
      const sortieIds = Array.from(new Set(stored.filter((i) => !drop.has(i.id)).map((i) => i.sortieId)));
      let signedIn = true;
      await Promise.all(
        sortieIds.map(async (sortieId) => {
          try {
            const res = await fetch(`/api/sorties/${sortieId}/photos`);
            if (res.status === 401) signedIn = false;
            if (res.status === 404) {
              for (const item of stored) if (item.sortieId === sortieId) drop.add(item.id);
              return;
            }
            if (!res.ok) return;
            const data = (await res.json()) as { photos: { id: string }[] };
            const known = new Set(data.photos.map((p) => p.id));
            for (const item of stored) {
              if (item.sortieId === sortieId && item.photoId && !known.has(item.photoId)) drop.add(item.id);
            }
          } catch {
            // Hors ligne : on garde tout, la file repartira avec le réseau.
          }
        }),
      );
      if (cancelled) return;
      if (drop.size > 0) io(() => deleteItems(Array.from(drop)));
      for (const item of stored) {
        if (drop.has(item.id)) continue;
        // Un envoi interrompu (onglet fermé, rechargement) reprend au début.
        const status = item.status === "uploading" || item.status === "error" ? "queued" : item.status;
        store.current.set(item.id, { ...item, status, progress: 0, retryAt: undefined });
      }
      // Les vignettes locales, pour que la grille retrouve ses images.
      await Promise.all(
        Array.from(store.current.values()).map(async (item) => {
          if (item.hasThumb || item.posterSize) {
            const thumb = await blobOf(item.id, item.isVideo ? "poster" : "thumb");
            if (thumb) {
              setPreview(item.id, thumb, 2);
              return;
            }
          }
          const file = await blobOf(item.id, "file");
          if (file) setPreview(item.id, file, 0, Boolean(item.isVideo));
        }),
      );
      if (cancelled) return;
      paintNow();
      started.current = signedIn;
      kick();
    })();
    return () => {
      cancelled = true;
    };
    // Une seule fois, au montage de l'espace opérateur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Réseau revenu, ou téléphone rallumé : un iPhone suspend l'onglet écran
  // verrouillé, la file repart dès qu'il revient au premier plan.
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible") kick();
    };
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [kick]);

  // ---- Publication --------------------------------------------------------

  const patchRun = useCallback((sortieId: string, change: Partial<PublicationRun> | ((run: PublicationRun) => Partial<PublicationRun>)) => {
    setRuns((prev) => {
      const run = prev[sortieId];
      if (!run) return prev;
      return { ...prev, [sortieId]: { ...run, ...(typeof change === "function" ? change(run) : change) } };
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
      let inviteError = "";
      if (invites > 0) {
        patchRun(sortieId, { phase: "inviting" });
        try {
          const res = await fetch(`/api/sorties/${sortieId}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emails: intent.emails }),
          });
          const data = (await res.json().catch(() => ({}))) as { sent?: number; error?: string };
          invitedOk = res.ok && (data.sent ?? invites) === invites;
          inviteError = data.error ?? "";
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
              : `Galerie publiée, mais l'envoi du lien a échoué. ${inviteError}`.trim()
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
  publishRef.current = () => {
    if (!started.current) return;
    const stored = readIntents();
    for (const sortieId of Object.keys(stored)) {
      const intent = stored[sortieId];
      if (!intent) continue;
      const remaining = Array.from(store.current.values()).some((item) => item.sortieId === sortieId && !isSettled(item));
      if (!remaining) void startRun(intent, true);
    }
  };

  // C'est le navigateur qui envoie : fermer l'onglet met le transfert en pause.
  // On prévient plutôt que de laisser un opérateur partir en croyant ses photos
  // parties (elles repartiront à sa prochaine visite, mais il doit le savoir).
  useEffect(() => {
    // Une publication en cours compte aussi : fermer l'onglet coupe le récit
    // de l'avancement, et l'invitation par e-mail qui la suit ne partirait pas.
    const inFlight =
      items.some((i) => isPhaseOne(i) || i.status === "background") ||
      Object.values(runs).some((r) => r.phase === "running" || r.phase === "sorting" || r.phase === "inviting");
    if (!inFlight) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [items, runs]);

  // ---- Ce que l'écran demande ---------------------------------------------

  const enqueue = useCallback(
    async (sortieId: string, files: File[]): Promise<void> => {
      if (files.length === 0) return;
      // Photos et vidéos seulement ; une vidéo au-delà du plafond de stockage
      // (lib/media.ts) est écartée tout de suite, plutôt que d'échouer après
      // des minutes d'envoi.
      // Type vide : un HEIC sur certains navigateurs, traité en photo comme avant.
      const media = files.filter((file) => !file.type || file.type.startsWith("image/") || isVideoFile(file));
      const accepted = media.filter((file) => !isVideoFile(file) || file.size <= MAX_VIDEO_BYTES);
      const tooLarge = media.length - accepted.length;
      const ignored = files.length - media.length;
      if (tooLarge > 0) {
        toast(
          tooLarge === 1
            ? `Une vidéo dépasse ${MAX_VIDEO_MB} Mo, elle n'a pas été ajoutée`
            : `${tooLarge} vidéos dépassent ${MAX_VIDEO_MB} Mo, elles n'ont pas été ajoutées`,
        );
      } else if (ignored > 0) {
        toast(ignored === 1 ? "Un fichier n'est ni une photo ni une vidéo" : `${ignored} fichiers ne sont ni des photos ni des vidéos`);
      }
      if (accepted.length === 0) return;

      // createdAt strictement croissant : la file et la grille suivent
      // l'ordre du dépôt.
      const now = Date.now();
      accepted.forEach((file, index) => {
        const video = isVideoFile(file);
        const item: UploadItem = {
          id: crypto.randomUUID(),
          sortieId,
          filename: file.name,
          size: file.size,
          type: file.type,
          status: "queued",
          progress: 0,
          attempts: 0,
          createdAt: now + index,
          batchAt: now,
          ...(video ? { isVideo: true, lastModified: file.lastModified } : {}),
        };
        store.current.set(item.id, item);
        blobs.current.set(item.id, { file });
        setPreview(item.id, file, 0, video);
        // Sauvegardé dans l'ordre, sans que rien ne l'attende : vider une
        // carte mémoire, c'est plusieurs centaines de mégaoctets à recopier.
        io(async () => {
          const latest = store.current.get(item.id);
          if (latest) await addItem({ ...latest, progress: 0 }, file);
        });
      });
      // Les vignettes apparaissent ici, avant le moindre appel réseau.
      paintNow();
      kick();
    },
    [io, kick, paintNow, setPreview, toast],
  );

  const retryFailed = useCallback(
    (sortieId: string) => {
      for (const item of Array.from(store.current.values())) {
        if (item.sortieId === sortieId && item.status === "failed") {
          // Une photo arrivée dont seul le traitement a échoué n'est pas renvoyée.
          const status = item.error === "Aperçu non généré" ? "sent" : "queued";
          patch(item.id, { status, progress: 0, attempts: 0, retryAt: undefined, error: undefined });
        }
      }
      kick();
    },
    [kick, patch],
  );

  const forgetPhotos = useCallback(
    async (sortieId: string, photoIds: string[]): Promise<void> => {
      const wanted = new Set(photoIds);
      removeItems(
        Array.from(store.current.values())
          .filter((item) => item.sortieId === sortieId && item.photoId && wanted.has(item.photoId))
          .map((item) => item.id),
      );
    },
    [removeItems],
  );

  const publish = useCallback(
    (intent: PublishIntent) => {
      const busy = Array.from(store.current.values()).some((i) => i.sortieId === intent.sortieId && !isSettled(i));
      if (!busy) {
        void startRun(intent, false);
        return;
      }
      const next = { ...readIntents(), [intent.sortieId]: intent };
      writeIntents(next);
      setIntents(next);
    },
    [startRun],
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
      const open = new Set(live.filter((i) => !isSettled(i)).map((i) => i.batchAt ?? i.createdAt));
      return {
        failed: mine.length - live.length,
        working: open.size > 0,
        hdRemaining: live.filter((i) => i.status === "background").length,
        unregistered: live.filter((i) => !i.photoId).length,
        items: mine,
        current: live.filter((i) => open.has(i.batchAt ?? i.createdAt)),
      };
    },
    [items],
  );

  // `items` en dépendance : la vignette locale d'un élément change sans que
  // la liste change de forme, l'écran doit quand même la relire.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useCallback((itemId: string): LocalPreview | undefined => previews.current.get(itemId), [items]);

  const value = useMemo<UploadQueueValue>(
    () => ({ forSortie, preview, enqueue, retryFailed, forgetPhotos, publish, cancelPublish, scheduledFor, publicationFor, dismissPublication }),
    [forSortie, preview, enqueue, retryFailed, forgetPhotos, publish, cancelPublish, scheduledFor, publicationFor, dismissPublication],
  );

  // L'indicateur ne s'affiche que loin de l'écran concerné : sur la sortie
  // elle-même, la barre basse dit déjà tout.
  const elsewhere = items.filter((i) => i.status !== "failed" && !pathname.endsWith(`/sorties/${i.sortieId}`));
  const pending = elsewhere.filter((i) => !isSettled(i));
  const remaining = pending.length;
  const hdElsewhere = elsewhere.filter((i) => i.status === "background").length;
  const elsewhereBytes = pending.reduce((sum, i) => sum + phaseOneBytes(i), 0);
  const elsewhereSent = pending.reduce((sum, i) => {
    if (i.status === "queued") return sum;
    if (i.status === "uploading") return sum + (phaseOneBytes(i) * Math.min(100, Math.max(0, i.progress))) / 100;
    return sum + phaseOneBytes(i);
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
      {remaining === 0 && !publishingElsewhere && hdElsewhere > 0 ? (
        <div className={styles.upPill} role="status" aria-live="polite">
          <span className={styles.upPillText}>
            <b>
              {hdElsewhere} photo{hdElsewhere > 1 ? "s" : ""}
            </b>{" "}
            en haute définition en route
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
