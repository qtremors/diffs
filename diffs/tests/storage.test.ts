import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { IDBDatabase, IDBFactory } from "fake-indexeddb";
import { loadSession, persistSession } from "../src/lib/utils/storage.ts";
import { processFile } from "../src/lib/utils/file.ts";
import type { SessionData } from "../src/lib/types.ts";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const draft = (oldText = "private original"): SessionData => ({
  files: [], originalId: null, oldText, newText: "private modified", mode: "text", pasteFormat: "text",
});

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", { value: new MemoryStorage(), configurable: true });
  Object.defineProperty(globalThis, "indexedDB", { value: new IDBFactory(), configurable: true });
});

async function storedRecord() {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("diffs-workspace", 1);
    request.onsuccess = () => resolve(request.result as IDBDatabase);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const transaction = db.transaction("sessions");
      const id = sessionStorage.getItem("diffs-tab");
      assert.ok(id);
      const request = transaction.objectStore("sessions").get(id);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

test("temporary sessions never open IndexedDB", async (t) => {
  const open = t.mock.method(indexedDB, "open", () => { throw new Error("Unexpected database access"); });
  assert.deepEqual(await loadSession(), { data: null, remember: false, deletionPending: false });
  await persistSession(draft(), false);
  assert.equal(open.mock.callCount(), 0);
  assert.equal(sessionStorage.getItem("diffs-tab"), null);
});

test("opt-in saves and restores one atomic snapshot with original byte fingerprints", async () => {
  const file = await processFile(new File(["hello\r\n"], "hello.txt", { type: "text/plain" }));
  const data = { ...draft(), files: [{ ...file, hash: "0".repeat(64) }], originalId: file.id };
  await persistSession(data, true);
  const restored = await loadSession();
  assert.equal(restored.remember, true);
  assert.equal(restored.deletionPending, false);
  assert.equal(restored.data?.oldText, data.oldText);
  assert.deepEqual(restored.data?.files[0].bytes, file.bytes);
  assert.equal(restored.data?.files[0].hash, file.hash);
  assert.equal(restored.data?.originalId, file.id);
});

test("a successful deletion removes the record and clears the pending marker", async () => {
  await persistSession(draft(), true);
  assert.ok(await storedRecord());
  const deletion = persistSession(draft(), false);
  assert.equal(sessionStorage.getItem("diffs-remember"), "false");
  assert.equal(sessionStorage.getItem("diffs-delete-pending"), "true");
  await deletion;
  assert.equal(await storedRecord(), undefined);
  assert.equal(sessionStorage.getItem("diffs-delete-pending"), null);
  assert.deepEqual(await loadSession(), { data: null, remember: false, deletionPending: false });
});

test("failed deletion stays pending across reload and can be retried", async (t) => {
  await persistSession(draft(), true);
  const transaction = IDBDatabase.prototype.transaction;
  const failure = t.mock.method(IDBDatabase.prototype, "transaction", function (this: IDBDatabase, ...args: Parameters<typeof transaction>) {
    const result = transaction.apply(this, args);
    if (args[1] === "readwrite") queueMicrotask(() => result.abort());
    return result;
  });
  await assert.rejects(persistSession(draft(), false), /saved copy could not be deleted/);
  assert.ok(await storedRecord());
  assert.equal(sessionStorage.getItem("diffs-remember"), "false");
  assert.deepEqual(await loadSession(), { data: null, remember: false, deletionPending: true });
  await assert.rejects(persistSession(draft("new private data"), true), /Delete the saved copy/);
  failure.mock.restore();
  await persistSession(draft(), false);
  assert.equal(await storedRecord(), undefined);
  assert.equal((await loadSession()).deletionPending, false);
  await persistSession(draft("fresh opt-in"), true);
  assert.equal((await loadSession()).data?.oldText, "fresh opt-in");
});

test("database-open failure during deletion preserves the pending marker", async (t) => {
  await persistSession(draft(), true);
  const open = t.mock.method(indexedDB, "open", () => { throw new Error("Storage disabled"); });
  await assert.rejects(persistSession(draft(), false), /saved copy could not be deleted/);
  assert.equal(sessionStorage.getItem("diffs-delete-pending"), "true");
  assert.equal((await loadSession()).deletionPending, true);
  open.mock.restore();
  await persistSession(draft(), false);
  assert.equal(await storedRecord(), undefined);
});

test("disabling retention suppresses queued writes and never resurrects the copy", async () => {
  await persistSession(draft(), true);
  const first = persistSession(draft("stale first"), true);
  const second = persistSession(draft("stale second"), true);
  const deletion = persistSession(draft(), false);
  await Promise.all([first, second, deletion]);
  assert.equal(await storedRecord(), undefined);
  assert.equal(sessionStorage.getItem("diffs-remember"), "false");
});

test("failed writes do not poison the queue or replace a good saved draft", async (t) => {
  await persistSession(draft("last good"), true);
  const transaction = IDBDatabase.prototype.transaction;
  const failure = t.mock.method(IDBDatabase.prototype, "transaction", function (this: IDBDatabase, ...args: Parameters<typeof transaction>) {
    const result = transaction.apply(this, args);
    if (args[1] === "readwrite") queueMicrotask(() => result.abort());
    return result;
  });
  await assert.rejects(persistSession(draft("failed edit"), true), /could not be saved/);
  assert.equal((await loadSession()).data?.oldText, "last good");
  failure.mock.restore();
  await persistSession(draft("recovered edit"), true);
  assert.equal((await loadSession()).data?.oldText, "recovered edit");
});

test("invalid drafts leave the good snapshot and preference untouched", async () => {
  await persistSession(draft("last good"), true);
  await assert.rejects(persistSession(draft("x".repeat(500001)), true), /500,000/);
  assert.equal((await loadSession()).data?.oldText, "last good");
  assert.equal(sessionStorage.getItem("diffs-remember"), "true");
});

test("aborted reads reject instead of hanging restore", async (t) => {
  await persistSession(draft(), true);
  const transaction = IDBDatabase.prototype.transaction;
  t.mock.method(IDBDatabase.prototype, "transaction", function (this: IDBDatabase, ...args: Parameters<typeof transaction>) {
    const result = transaction.apply(this, args);
    queueMicrotask(() => result.abort());
    return result;
  });
  await assert.rejects(loadSession());
});
