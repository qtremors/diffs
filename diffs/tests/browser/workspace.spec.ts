import { test, expect, openWorkspace, example, report, textFile, expectNoOverflow } from "./fixtures.ts";

test.beforeEach(async ({ page }) => { await openWorkspace(page); });

test("keyboard users can reveal the skip link and focus the workspace", async ({ page }) => {
  const skip = page.getByRole("link", { name: "Skip to comparison", exact: true });
  await expect(skip).not.toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("JSON search and report preserve the existing export contract", async ({ page }) => {
  await example(page);
  await page.getByRole("searchbox", { name: "Search comparison" }).fill("/theme");
  await expect(page.locator(".data-table tbody tr")).toHaveCount(1);
  expect((await report(page)).changes).toHaveLength(3);
  await page.getByRole("combobox", { name: "Compare as", exact: true }).selectOption("bytes");
  await expect(page.getByRole("heading", { name: /bytes differ at matching offsets/ })).toBeVisible();
  expect((await report(page)).type).toBe("binary");
});

test("opt-in reload recovery and Reset remove the saved copy", async ({ page }) => {
  await example(page);
  await page.getByRole("checkbox", { name: "Remember this tab", exact: true }).check();
  await expect(page.locator(".session-status")).toContainText("Saved in this browser tab");
  await page.reload();
  await expect(page.locator(".file-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.getByRole("heading", { name: "JSON fields changed", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".session-status")).toContainText("Temporary session");
  await page.reload();
  await expect(page.getByRole("button", { name: "Choose files", exact: true })).toBeVisible();
  await expect(page.locator(".file-card")).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Remember this tab", exact: true })).not.toBeChecked();
});

test("failed deletion remains recoverable across reload", async ({ page }) => {
  await example(page);
  await page.getByRole("checkbox", { name: "Remember this tab", exact: true }).check();
  await expect(page.locator(".session-status")).toContainText("Saved in this browser tab");
  await page.evaluate(() => {
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args: Parameters<typeof transaction>) {
      const result = Reflect.apply(transaction, this, args) as IDBTransaction;
      if (args[1] === "readwrite") queueMicrotask(() => result.abort());
      return result;
    };
  });
  await page.getByRole("checkbox", { name: "Remember this tab", exact: true }).uncheck();
  await expect(page.locator(".session-status")).toContainText("could not be deleted");
  await expectNoOverflow(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "Retry deletion", exact: true })).toBeVisible();
  await expect(page.locator(".file-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Retry deletion", exact: true }).click();
  await expect(page.locator(".session-status")).toContainText("Temporary session");
  expect(await page.evaluate(() => sessionStorage.getItem("diffs-delete-pending"))).toBeNull();
});

test("a malformed saved record can be cleared from an empty workspace", async ({ page }) => {
  await page.evaluate(async () => {
    sessionStorage.setItem("diffs-tab", "invalid-snapshot");
    sessionStorage.setItem("diffs-remember", "true");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("diffs-workspace", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("sessions");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("sessions", "readwrite");
      transaction.objectStore("sessions").put({ version: 999 }, "invalid-snapshot");
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  await expect(page.locator(".error-banner")).toContainText("unsupported format");
  await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".session-status")).toContainText("Temporary session");
  await page.reload();
  await expect(page.getByRole("button", { name: "Choose files", exact: true })).toBeVisible();
  await expect(page.locator(".error-banner")).toHaveCount(0);
});

test("cancelling a stalled worker permits a new comparison", async ({ page }) => {
  await page.evaluate(() => {
    const postMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message: unknown, options?: StructuredSerializeOptions | Transferable[]) {
      if (message && typeof message === "object" && "kind" in message && message.kind === "text") return;
      return Reflect.apply(postMessage, this, [message, options]);
    };
  });
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.txt", "old"), textFile("modified.txt", "new"),
  ]);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await page.getByRole("button", { name: "Cancel comparison", exact: true }).click();
  await expect(page.getByText("Comparison paused.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await example(page);
});

test("native pasted edits, undo and options preserve source text", async ({ page }) => {
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  const original = page.locator('.cm-content[aria-label="Original"]');
  const modified = page.locator('.cm-content[aria-label="Modified"]');
  await original.fill("alpha\nbeta\n");
  await modified.fill("alpha\ngamma\n");
  await expect(page.locator(".result-summary")).toContainText("lines");
  await modified.press("End");
  await page.keyboard.insertText("extra");
  await modified.press("ControlOrMeta+z");
  await expect(modified).not.toContainText("extra");
  await page.getByRole("checkbox", { name: "Ignore whitespace", exact: true }).check();
  await expect(original).toContainText("beta");
  await expect(modified).toContainText("gamma");
  await page.getByRole("button", { name: "Swap", exact: true }).click();
  await expect(original).toContainText("gamma");
  await expect(modified).toContainText("beta");
});
