import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * La file d'envoi des photos, gardée sur l'appareil (UploadQueueProvider).
 *
 * Depuis le 24/09/2026, deux magasins : `queue` ne porte que l'état de chaque
 * photo (quelques centaines d'octets), `blobs` ses fichiers (l'original, la
 * copie de travail, la vignette), écrits une fois. Avant, l'état et les
 * fichiers vivaient dans le même enregistrement : chaque changement d'état
 * — une demi-douzaine par photo — réécrivait l'original de 3 à 12 Mo, soit
 * des gigaoctets d'écriture disque pour une carte mémoire sur un iPhone.
 *
 * L'état fait foi en mémoire (UploadQueueProvider) ; IndexedDB n'est que la
 * sauvegarde qui permet de reprendre après un rechargement.
 *
 * Statuts :
 * "queued" = à envoyer (préparation, enregistrement puis envoi de la copie).
 * "uploading" = octets en route.
 * "sent" = les octets sont arrivés, le traitement serveur n'est pas confirmé.
 * "background" = la photo est publiable ; reste l'original, en tâche de fond.
 * "done" = tout est arrivé.
 * "failed" = abandonné après plusieurs tentatives ; l'écran le dit et
 * propose de réessayer. "error" n'est plus écrit — relu depuis les files
 * d'avant le 06/09.
 */
export type UploadStatus = "queued" | "uploading" | "sent" | "background" | "done" | "failed" | "error";

export type BlobKind = "file" | "work" | "thumb" | "poster";

export interface UploadItem {
  id: string;
  sortieId: string;
  filename: string;
  /** Taille et type du fichier d'origine (le fichier lui-même est dans `blobs`). */
  size: number;
  type: string;
  status: UploadStatus;
  /** Avancement d'un envoi en cours, en mémoire seulement. */
  progress: number;
  attempts?: number;
  error?: string;
  createdAt: number;
  /** Le dépôt dont elle fait partie : l'avancement ne parle que du dernier. */
  batchAt?: number;
  photoId?: string;
  signedUrl?: string;
  posterSignedUrl?: string | null;
  /** Quand les URL d'envoi ont été signées (6 h de validité). */
  urlsAt?: number;
  /** Prochain essai pas avant (réseau coupé, stockage qui refuse). */
  retryAt?: number;
  /** Vidéo : sa vignette et ce que le navigateur en a lu (lib/video-probe.ts). */
  isVideo?: boolean;
  lastModified?: number;
  probed?: boolean;
  posterSize?: number | null;
  durationSec?: number | null;
  takenAt?: string | null;
  /** Photo : copie de travail et vignette locale faites (lib/fast-copy.ts). */
  prepared?: boolean;
  workSize?: number | null;
  hasThumb?: boolean;
  /** La copie de travail (ou la vignette d'une vidéo) est dans le stockage. */
  posterSent?: boolean;
  /** Le serveur attend l'original en seconde phase (Photo.originalPending). */
  hdLater?: boolean;
  hdAttempts?: number;
}

interface UploadQueueDB extends DBSchema {
  queue: {
    key: string;
    value: UploadItem;
    indexes: { "by-sortie": string };
  };
  blobs: {
    key: string;
    value: Blob;
  };
}

/** La forme d'avant le 24/09/2026 : les fichiers dans l'enregistrement. */
interface LegacyItem extends Omit<UploadItem, "size" | "type"> {
  file?: Blob;
  work?: Blob | null;
  thumb?: Blob | null;
  poster?: Blob | null;
  size?: number;
  type?: string;
}

const blobKey = (id: string, kind: BlobKind): string => `${id}:${kind}`;

let dbPromise: Promise<IDBPDatabase<UploadQueueDB>> | null = null;

function getDb(): Promise<IDBPDatabase<UploadQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<UploadQueueDB>("linktrip-uploads", 2, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          const store = db.createObjectStore("queue", { keyPath: "id" });
          store.createIndex("by-sortie", "sortieId");
        }
        if (oldVersion < 2) {
          db.createObjectStore("blobs");
          // Un dépôt en cours au moment de la mise à jour n'est pas perdu : ses
          // fichiers passent dans `blobs`, son état reste dans `queue`.
          const queue = tx.objectStore("queue");
          const blobs = tx.objectStore("blobs");
          let cursor = await queue.openCursor();
          while (cursor) {
            const old = cursor.value as unknown as LegacyItem;
            const { file, work, thumb, poster, ...rest } = old;
            if (file) await blobs.put(file, blobKey(old.id, "file"));
            if (work) await blobs.put(work, blobKey(old.id, "work"));
            if (thumb) await blobs.put(thumb, blobKey(old.id, "thumb"));
            if (poster) await blobs.put(poster, blobKey(old.id, "poster"));
            const meta: UploadItem = {
              ...rest,
              size: old.size ?? file?.size ?? 0,
              type: old.type ?? file?.type ?? "",
              workSize: work?.size ?? null,
              hasThumb: Boolean(thumb),
              posterSize: poster?.size ?? null,
            };
            await cursor.update(meta);
            cursor = await cursor.continue();
          }
        }
      },
    });
  }
  return dbPromise;
}

/** L'état de toute la file, sans les fichiers. */
export async function loadItems(): Promise<UploadItem[]> {
  const db = await getDb();
  const all = await db.getAll("queue");
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

/** Un nouvel élément : son état et son fichier d'origine, en une transaction. */
export async function addItem(item: UploadItem, file: Blob): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["queue", "blobs"], "readwrite");
  await Promise.all([tx.objectStore("blobs").put(file, blobKey(item.id, "file")), tx.objectStore("queue").put(item), tx.done]);
}

/** Enregistre l'état courant d'un élément (petit : jamais de fichier dedans). */
export async function saveItem(item: UploadItem): Promise<void> {
  const db = await getDb();
  await db.put("queue", item);
}

export async function putBlob(id: string, kind: BlobKind, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put("blobs", blob, blobKey(id, kind));
}

export async function getBlob(id: string, kind: BlobKind): Promise<Blob | undefined> {
  const db = await getDb();
  return db.get("blobs", blobKey(id, kind));
}

/** Supprime des éléments et tous leurs fichiers. */
export async function deleteItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(["queue", "blobs"], "readwrite");
  const queue = tx.objectStore("queue");
  const blobs = tx.objectStore("blobs");
  const kinds: BlobKind[] = ["file", "work", "thumb", "poster"];
  await Promise.all([
    ...ids.map((id) => queue.delete(id)),
    ...ids.flatMap((id) => kinds.map((kind) => blobs.delete(blobKey(id, kind)))),
    tx.done,
  ]);
}
