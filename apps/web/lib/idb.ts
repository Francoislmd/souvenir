import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  sortieId: string;
  file: Blob;
  filename: string;
  status: UploadStatus;
  progress: number;
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
