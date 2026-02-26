// ---------------------------------------------------------------------------
// IndexedDB storage utility for persisting comparison files
// ---------------------------------------------------------------------------

import type { ComparisonFile } from "@/lib/types";

const DB_NAME = "diffs-storage";
const DB_VERSION = 1;
const STORE_NAME = "files";
const ORIGINAL_KEY = "diffs-original-id";

/** Open (or create) the IndexedDB database */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save all comparison files to IndexedDB */
export async function saveFiles(files: ComparisonFile[], originalId: string | null): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  // Clear existing entries first
  store.clear();

  // Write each file
  for (const file of files) {
    store.put(file);
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Persist the original selection
  if (originalId) {
    sessionStorage.setItem(ORIGINAL_KEY, originalId);
  } else {
    sessionStorage.removeItem(ORIGINAL_KEY);
  }

  db.close();
}

/** Load all comparison files from IndexedDB */
export async function loadFiles(): Promise<{
  files: ComparisonFile[];
  originalId: string | null;
}> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  const files = await new Promise<ComparisonFile[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  db.close();

  const originalId = sessionStorage.getItem(ORIGINAL_KEY);

  return { files, originalId };
}

/** Clear all stored data */
export async function clearStorage(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  sessionStorage.removeItem(ORIGINAL_KEY);
  db.close();
}

/** Check if there is any stored data */
export async function hasStoredData(): Promise<boolean> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const request = tx.objectStore(STORE_NAME).count();

  const count = await new Promise<number>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return count > 0;
}
