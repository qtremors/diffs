import type { SessionData } from "@/lib/types";
import { validateSession } from "@/lib/session";
import { hashBytes } from "@/lib/comparison/binary";
export { validateSession } from "@/lib/session";

const DB_NAME = "diffs-workspace";
const STORE = "sessions";
const DELETE_PENDING = "diffs-delete-pending";
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
    let blocked = false;
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      }
    };
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Your work will stay in this tab.",
        ),
      );
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error(
          "Browser storage is busy. Close other Diffs tabs and try again.",
        ),
      );
    };
  });
}

export async function loadSession(): Promise<{
  data: SessionData | null;
  remember: boolean;
  deletionPending: boolean;
}> {
  // A failed delete must survive reload without restoring or resaving the copy.
  if (sessionStorage.getItem(DELETE_PENDING) === "true")
    return { data: null, remember: false, deletionPending: true };
  const remember = sessionStorage.getItem("diffs-remember") === "true";
  if (!remember) return { data: null, remember: false, deletionPending: false };
  const id = sessionId();
  const db = await openDB();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const transaction = db.transaction(STORE);
      const request = transaction.objectStore(STORE).get(id);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(new Error("The saved session could not be read."));
      request.onerror = () => reject(request.error);
    });
    const data = value ? validateSession(value) : null;
    // Recompute original-byte fingerprints rather than trusting persisted digests.
    if (data)
      for (const file of data.files)
        if (file.bytes) file.hash = await hashBytes(file.bytes);
    return { data, remember, deletionPending: false };
  } finally {
    db.close();
  }
}

export async function persistSession(
  data: SessionData,
  remember: boolean,
): Promise<void> {
  // Validate before touching the preference or an existing good snapshot.
  const snapshot = remember ? validateSession({ ...data, version: 2 }) : null;
  if (remember && sessionStorage.getItem(DELETE_PENDING) === "true")
    throw new Error("Delete the saved copy before enabling Remember this tab again.");
  const id = remember ? sessionId() : sessionStorage.getItem("diffs-tab");
  // Set this before queuing, so reload cannot hide an incomplete deletion.
  if (!remember && id) sessionStorage.setItem(DELETE_PENDING, "true");
  sessionStorage.setItem("diffs-remember", String(remember));
  if (!id) return;
  const operation = async () => {
    // Disabling retention also suppresses saves that have not started yet.
    if (remember && (sessionStorage.getItem("diffs-remember") !== "true" ||
      sessionStorage.getItem(DELETE_PENDING) === "true")) return;
    let db: IDBDatabase | undefined;
    try {
      db = await openDB();
      const connection = db;
      await new Promise<void>((resolve, reject) => {
        const transaction = connection.transaction(STORE, "readwrite");
        const store = transaction.objectStore(STORE);
        if (remember) store.put({ ...snapshot, version: 2 }, id);
        else store.delete(id);
        transaction.oncomplete = () => {
          try {
            if (!remember) sessionStorage.removeItem(DELETE_PENDING);
            resolve();
          } catch (error) { reject(error); }
        };
        const fail = () => reject(new Error(remember
          ? "This session could not be saved. Browser storage may be full."
          : "The saved copy could not be deleted. Retry deletion or clear this site's browser data."));
        transaction.onerror = fail;
        transaction.onabort = fail;
      });
    } catch (error) {
      if (!remember)
        throw new Error("The saved copy could not be deleted. Retry deletion or clear this site's browser data.", { cause: error });
      throw error;
    } finally {
      db?.close();
    }
  };
  const result = queue.then(operation, operation);
  queue = result.catch(() => {});
  return result;
}
