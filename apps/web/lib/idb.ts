import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type UploadStatus = "queued" | "uploading" | "done" | "error";
export type UploadOwnerType = "delivery" | "batch";

export interface UploadItem {
  id: string;
  ownerId: string;
  ownerType: UploadOwnerType;
  file: Blob;
  filename: string;
  kind: "PHOTO" | "VIDEO";
  status: UploadStatus;
  progress: number;
  mediaId?: string;
  signedUrl?: string;
  error?: string;
  createdAt: number;
}

interface UploadQueueDB extends DBSchema {
  queue: {
    key: string;
    value: UploadItem;
    indexes: { "by-owner": string };
  };
}

let dbPromise: Promise<IDBPDatabase<UploadQueueDB>> | null = null;

function getDb(): Promise<IDBPDatabase<UploadQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<UploadQueueDB>("souvenir-uploads", 2, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore("queue", { keyPath: "id" });
        }
        const store = transaction.objectStore("queue");
        if ((store.indexNames as unknown as DOMStringList).contains("by-delivery")) {
          store.deleteIndex("by-delivery" as never);
        }
        if (!store.indexNames.contains("by-owner")) {
          store.createIndex("by-owner", "ownerId");
        }
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

export async function getUploadItemsForOwner(ownerId: string): Promise<UploadItem[]> {
  const db = await getDb();
  return db.getAllFromIndex("queue", "by-owner", ownerId);
}
