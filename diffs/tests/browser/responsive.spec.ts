import { test, expect, openWorkspace, example, textFile, expectNoOverflow } from "./fixtures.ts";

test.beforeEach(async ({ page }) => { await openWorkspace(page); });

test("the workspace fits the viewport and touch controls remain usable", async ({ page }, testInfo) => {
  await expectNoOverflow(page);
  await example(page);
  await expectNoOverflow(page);
  if ((page.viewportSize()?.width ?? 0) <= 600) {
    const buttons = page.locator("button:visible");
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box?.height, await button.innerText()).toBeGreaterThanOrEqual(44);
    }
    const cells = page.locator(".json-table tbody td");
    for (const cell of await cells.all()) {
      const box = await cell.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
    await expect(page.locator(".table-scroll-hint")).not.toBeVisible();
  }
  await testInfo.attach("json-layout", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  await page.getByRole("button", { name: "Try an example" }).click();
  await expect(page.locator(".result-summary")).toContainText("lines");
  await expectNoOverflow(page);
  if ((page.viewportSize()?.width ?? 0) <= 600) {
    const original = await page.locator('.cm-content[aria-label="Original"]').boundingBox();
    const modified = await page.locator('.cm-content[aria-label="Modified"]').boundingBox();
    expect(modified!.y).toBeGreaterThan(original!.y);
  }
});

test("wide table results scroll inside a labelled keyboard-accessible region", async ({ page }) => {
  const headings = Array.from({ length: 16 }, (_, i) => `column_${i}`).join(",");
  const values = Array.from({ length: 16 }, (_, i) => `value_${i}`).join(",");
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.csv", `${headings}\n${values}\n`, "text/csv"),
    textFile("modified.csv", `${headings}\nchanged,${values.split(",").slice(1).join(",")}\n`, "text/csv"),
  ]);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  const region = page.getByRole("region", { name: "Table comparison results", exact: true });
  await expect(region).toBeVisible();
  await expect(page.locator(".table-scroll-hint")).toBeVisible();
  await expectNoOverflow(page);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("long filenames and cancelled reads do not overflow or reappear", async ({ page }) => {
  await page.evaluate(() => {
    const read = Blob.prototype.arrayBuffer;
    const pending = globalThis as typeof globalThis & { releaseRead?: () => void };
    Blob.prototype.arrayBuffer = function () {
      if (this instanceof File && this.name.startsWith("slow")) {
        return new Promise<ArrayBuffer>((resolve) => {
          void read.call(this).then((bytes) => { pending.releaseRead = () => resolve(bytes); });
        });
      }
      return read.call(this);
    };
  });
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile(`slow-${"name".repeat(50)}.txt`, "old"),
  ]);
  await expect(page.getByRole("button", { name: "Cancel opening", exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await page.getByRole("button", { name: "Cancel opening", exact: true }).click();
  await example(page);
  await page.evaluate(() => (globalThis as typeof globalThis & { releaseRead?: () => void }).releaseRead?.());
  await expect(page.locator(".file-card")).toHaveCount(2);
  await expect(page.locator(".file-list")).not.toContainText("slow-");
  await expectNoOverflow(page);
});
