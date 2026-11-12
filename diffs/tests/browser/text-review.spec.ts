import { test, expect, openWorkspace, textFile, expectNoOverflow } from "./fixtures.ts";
import type { Page } from "@playwright/test";

async function files(page: Page, original: string, modified: string) {
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.txt", original), textFile("modified.txt", modified),
  ]);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.locator(".text-diff-viewer .result-summary")).toContainText("lines");
}

async function captureClipboard(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => {
        (globalThis as typeof globalThis & { copiedText?: string }).copiedText = text;
      },
    } });
  });
}
const copied = (page: Page) => page.evaluate(() => (globalThis as typeof globalThis & { copiedText?: string }).copiedText);

test.beforeEach(async ({ page }) => { await openWorkspace(page); });

test("file find supports literal matches, scope, case, keyboard navigation and closing", async ({ page }) => {
  await files(page, "ALPHA\nliteral [x]\n", "alpha ALPHA\nliteral [x]\n");
  await page.getByRole("button", { name: "Find in text", exact: true }).click();
  const query = page.getByRole("searchbox", { name: "Find text", exact: true });
  await query.fill("alpha");
  await expect(page.locator(".search-count")).toHaveText("1 of 2 matches");
  await query.press("Enter");
  await expect(page.locator(".search-count")).toHaveText("2 of 2 matches");
  await query.press("Shift+Enter");
  await expect(page.locator(".search-count")).toHaveText("1 of 2 matches");
  await page.getByRole("checkbox", { name: "Match case", exact: true }).check();
  await expect(page.locator(".search-count")).toHaveText("1 of 1 matches");
  await page.getByRole("combobox", { name: "Search in", exact: true }).selectOption("original");
  await expect(page.locator(".search-count")).toHaveText("No matches");
  await page.getByRole("checkbox", { name: "Match case", exact: true }).uncheck();
  await expect(page.locator(".search-count")).toHaveText("1 of 1 matches");
  await query.fill("[x]");
  await expect(page.locator(".diff-scroll .search-match-current")).toHaveText("[x]");
  await query.press("Escape");
  await expect(page.getByRole("search", { name: "Find in comparison" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Find in text", exact: true })).toBeFocused();
  await page.keyboard.press("ControlOrMeta+f");
  await expect(query).toBeFocused();
  await expect(query).toHaveValue("[x]");
  await expectNoOverflow(page);
});

test("file block copy preserves CRLF, whitespace, EOF and navigation", async ({ page }) => {
  const original = "keep\r\n  old \t\r\ncontext\r\nlast old";
  const modified = "keep\r\n new  \r\ncontext\r\nlast new";
  await files(page, original, modified);
  await captureClipboard(page);
  await page.getByRole("button", { name: "Copy original change", exact: true }).click();
  expect(await copied(page)).toBe("  old \t\r\n");
  await page.getByRole("button", { name: "Copy modified change", exact: true }).click();
  expect(await copied(page)).toBe(" new  \r\n");
  await page.getByRole("button", { name: "Next change", exact: true }).click();
  await expect(page.locator(".change-block-actions")).toContainText("Change 2 of 2");
  await page.getByRole("button", { name: "Copy modified change", exact: true }).click();
  expect(await copied(page)).toBe("last new");
  await page.getByRole("button", { name: "Copy modified text", exact: true }).click();
  expect(await copied(page)).toBe(modified);
  await expectNoOverflow(page);
});

test("find reaches virtualized long lines and reveals matching unchanged context", async ({ page }) => {
  const context = Array.from({ length: 1400 }, (_, i) => i === 1300 ? `${"x".repeat(1500)} needle` : `context ${i}`).join("\n");
  await files(page, `old\n${context}`, `new\n${context}`);
  await expect(page.locator(".diff-row")).not.toHaveCount(1401);
  await page.getByRole("button", { name: "Find in text", exact: true }).click();
  await page.getByRole("searchbox", { name: "Find text", exact: true }).fill("needle");
  const match = page.locator(".diff-scroll .search-match-current");
  await expect(match).toHaveText("needle");
  await expect.poll(() => page.locator(".diff-scroll").evaluate((element) => element.scrollTop)).toBeGreaterThan(20000);
  await expect.poll(() => match.evaluate((element) => {
    const region = element.closest(".line-content")!.getBoundingClientRect();
    const current = element.getBoundingClientRect();
    return current.left >= region.left && current.right <= region.right;
  })).toBe(true);
  await page.getByRole("checkbox", { name: "Changes only", exact: true }).check();
  await expect(match).toHaveText("needle");
  await expect(page.getByText("Search also reveals matching unchanged lines.", { exact: true })).toBeVisible();
  await expectNoOverflow(page);
});

test("editable find reveals folded text and preserves edits and undo", async ({ page }) => {
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  const original = page.locator('.cm-content[aria-label="Original"]');
  const modified = page.locator('.cm-content[aria-label="Modified"]');
  const context = Array.from({ length: 80 }, (_, i) => i === 60 ? "needle alpha alpha" : `context ${i}`).join("\n");
  await original.fill(`old\n${context}`);
  await modified.fill(`new\n${context}`);
  await page.getByRole("checkbox", { name: "Changes only", exact: true }).check();
  await page.getByRole("button", { name: "Find in text", exact: true }).click();
  const query = page.getByRole("searchbox", { name: "Find text", exact: true });
  await query.fill("alpha");
  await expect(page.locator(".search-count")).toHaveText("1 of 2 matches");
  await expect(query).toBeFocused();
  await expect(page.locator(".editable-diff .search-match-current")).toHaveText("alpha");
  await page.getByRole("button", { name: "Next match", exact: true }).click();
  await expect(page.locator(".search-count")).toHaveText("2 of 2 matches");
  await modified.press("ControlOrMeta+End");
  await page.keyboard.insertText(" extra");
  await modified.press("ControlOrMeta+z");
  await expect(modified).not.toContainText("extra");
  await expect(page.locator(".search-count")).toHaveText("2 of 2 matches");
  await page.getByRole("button", { name: "Close find", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Changes only", exact: true })).toBeChecked();
  await expect(page.locator(".editable-diff .search-match")).toHaveCount(0);
  await expectNoOverflow(page);
});

test("editable block copying follows selected change and disables absent sources", async ({ page }) => {
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  const original = page.locator('.cm-content[aria-label="Original"]');
  const modified = page.locator('.cm-content[aria-label="Modified"]');
  await original.fill("keep\n  old \t\ncontext\nlast old");
  await modified.fill("keep\n new  \ncontext\nlast new");
  await captureClipboard(page);
  await page.getByRole("button", { name: "Copy modified change", exact: true }).click();
  expect(await copied(page)).toBe(" new  \n");
  await page.getByRole("button", { name: "Next change", exact: true }).click();
  await page.getByRole("button", { name: "Copy original change", exact: true }).click();
  expect(await copied(page)).toBe("last old");
  await original.fill("");
  await modified.fill("only added\n");
  await expect(page.getByRole("button", { name: "Copy original change", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Copy modified change", exact: true }).click();
  expect(await copied(page)).toBe("only added\n");
  await expectNoOverflow(page);
});

test("find caps dense matches and reports a useful limit", async ({ page }) => {
  await files(page, "old", "z".repeat(3000));
  await page.getByRole("button", { name: "Find in text", exact: true }).click();
  await page.getByRole("searchbox", { name: "Find text", exact: true }).fill("z");
  await expect(page.locator(".search-count")).toHaveText("1 of 2,000+ matches");
  await expect(page.getByText("Showing the first 2,000 matches. Refine your search to see more.", { exact: true })).toBeVisible();
  await expectNoOverflow(page);
});

test("unavailable clipboard reports a failure without breaking the comparison", async ({ page }) => {
  await files(page, "old", "new");
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
  await page.getByRole("button", { name: "Copy modified change", exact: true }).click();
  await expect(page.getByText("Copy is unavailable. Select and copy the text instead.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Find in text", exact: true }).click();
  await page.getByRole("searchbox", { name: "Find text", exact: true }).fill("new");
  await expect(page.locator(".search-count")).toHaveText("1 of 1 matches");
});
