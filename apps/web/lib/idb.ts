import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * "sent" = les octets sont arrivés dans le stockage, le traitement serveur
 * (miniature, filigrane) n'est pas encore confirmé. C'est l'état qui permet à
 * l'envoi de ne plus attendre le traitement : l'opérateur voit son envoi
 * terminé dès que ses fichiers sont partis.
 * "failed" = abandonné après plusieurs tentatives ; l'écran le dit et propose
 * de réessayer, au lieu de tourner en boucle en laissant la barre à l'écran.
 * "error" n'est plus écrit — gardé pour relire les files d'avant.
 */
export type UploadStatus = "queued" | "uploading" | "sent" | "done" | "failed" | "error";

export interface UploadItem {
  id: string;
  sortieId: string;
  file: Blob;
  filename: string;
  status: UploadStatus;
  /** Écrit seulement aux changements d'état — jamais à chaque paquet d'octets
   *  (une écriture IndexedDB par tick réécrit tout le fichier : la page gelait). */
  progress: number;
  attempts?: number;
  photoId?: string;
  signedUrl?: string;
  error?: string;
  createdAt: number;
}

interface UploadQueueDB extends DBSchema {
  queue: {
    key: string;
    value: UploadItem;
    indexes: { "by-sortie": string };
  };
}

let dbPromise: Promise<IDBPDatabase<UploadQueueDB>> | null = null;

function getDb(): Promise<IDBPDatabase<UploadQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<UploadQueueDB>("linktrip-uploads", 1, {
      upgrade(db) {
        const store = db.createObjectStore("queue", { keyPath: "id" });
        store.createIndex("by-sortie", "sortieId");
      },
    });
  }
  return dbPromise;
}

export async function addUploadItem(item: UploadItem): Promise<void> {
  const db = await getDb();
  await db.put("queue", item);
}

export async function updateUploadItem(id: string, patch: Partial<UploadItem>): Promise<void> {
  const db = await getDb();
  const existing = await db.get("queue", id);
  if (!existing) return;
  await db.put("queue", { ...existing, ...patch });
}

export async function getUploadItemsForSortie(sortieId: string): Promise<UploadItem[]> {
  const db = await getDb();
  return db.getAllFromIndex("queue", "by-sortie", sortieId);
}

export async function deleteUploadItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction("queue", "readwrite");
  await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
}

/** Une photo supprimée côté serveur ne doit plus peser dans la file locale :
 *  sinon elle continue d'être comptée dans l'avancement et son aperçu local
 *  survit à sa suppression. */
export async function deleteUploadItemsByPhotoIds(sortieId: string, photoIds: string[]): Promise<void> {
  if (photoIds.length === 0) return;
  const wanted = new Set(photoIds);
  const all = await getUploadItemsForSortie(sortieId);
  await deleteUploadItems(all.filter((item) => item.photoId && wanted.has(item.photoId)).map((item) => item.id));
}

/** Les envois terminés n'ont plus rien à faire dans la file : le serveur a la
 *  photo et sa miniature. Sans ce ménage la file grossit à chaque sortie et
 *  garde en mémoire les fichiers d'origine, plusieurs mégaoctets chacun. */
export async function purgeFinishedForSortie(sortieId: string): Promise<void> {
  const all = await getUploadItemsForSortie(sortieId);
  await deleteUploadItems(all.filter((item) => item.status === "done").map((item) => item.id));
}
