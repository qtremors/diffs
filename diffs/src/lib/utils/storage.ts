import type { SessionData } from "@/lib/types";
import { validateSession } from "@/lib/session";
import { hashBytes } from "@/lib/comparison/binary";
export { validateSession } from "@/lib/session";

const DB_NAME = "diffs-workspace";
const STORE = "sessions";
let queue: Promise<unknown> = Promise.resolve();

function sessionId(): string {
  let id = sessionStorage.getItem("diffs-tab");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("diffs-tab", id);
  }
  return id;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Your work will stay in this tab.",
        ),
      );
    request.onblocked = () =>
      reject(
        new Error(
          "Browser storage is busy. Close other Diffs tabs and try again.",
        ),
      );
  });
}

export async function loadSession(): Promise<{
  data: SessionData | null;
  remember: boolean;
}> {
  const remember = sessionStorage.getItem("diffs-remember") === "true";
  if (!remember) return { data: null, remember: false };
  const id = sessionId();
  const db = await openDB();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const data = value ? validateSession(value) : null;
    // Recompute original-byte fingerprints rather than trusting persisted digests.
    if (data)
      for (const file of data.files)
        if (file.bytes) file.hash = await hashBytes(file.bytes);
    return { data, remember };
  } finally {
    db.close();
  }
}

export function persistSession(
  data: SessionData,
  remember: boolean,
): Promise<void> {
  const operation = async () => {
    // Do not replace a good saved draft with inputs that cannot be restored.
    const snapshot = remember ? validateSession({ ...data, version: 2 }) : data;
    sessionStorage.setItem("diffs-remember", String(remember));
    // No database access is necessary for a temporary session that was never saved.
    if (!remember && !sessionStorage.getItem("diffs-tab")) return;
    const id = sessionId();
    const db = await openDB();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        const store = transaction.objectStore(STORE);
        if (remember) store.put({ ...snapshot, version: 2 }, id);
        else store.delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(
            new Error(
              "This session could not be saved. Browser storage may be full.",
            ),
          );
        transaction.onabort = () =>
          reject(
            new Error(
              "This session could not be saved. Browser storage may be full.",
            ),
          );
      });
    } finally {
      db.close();
    }
  };
  const result = queue.then(operation, operation);
  queue = result.catch(() => {});
  return result;
}
