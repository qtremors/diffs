import { mkdir, writeFile } from "node:fs/promises";
import { applyPatch } from "diff";
import { test, expect, downloadedBytes, openWorkspace, report, textFile, pdf } from "./fixtures.ts";

test.beforeEach(async ({ page }) => { await openWorkspace(page); });

test("text layouts and downloaded patches preserve original source bytes", async ({ page }) => {
  const original = "alpha\r\nbeta\r\n";
  const modified = "alpha\r\ngamma\r\n";
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.txt", original), textFile("modified.txt", modified),
  ]);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.locator(".text-diff-viewer .result-summary")).toContainText("lines");
  await expect(page.getByRole("heading", { name: "The comparison", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Unified", exact: true }).click();
  await expect(page.locator(".diff-unified")).toBeVisible();
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await expect(page.locator(".diff-unified")).toHaveCount(0);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Patch", exact: true }).click();
  const patch = (await downloadedBytes(await downloaded)).toString("utf8");
  expect(applyPatch(original, patch)).toBe(modified);
});

test("image navigation, wipe and PNG export work after worker rendering", async ({ page }) => {
  const svg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="800"><rect width="1400" height="800" fill="${color}"/></svg>`;
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.svg", svg("red"), "image/svg+xml"),
    textFile("modified.svg", svg("blue"), "image/svg+xml"),
  ]);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.locator(".image-diff-viewer .result-summary")).toContainText("100.00% changed");
  const stage = page.locator(".image-stage");
  const world = page.locator(".image-world");
  if ((page.viewportSize()?.width ?? 0) <= 600) await expect(stage).toHaveCSS("touch-action", "pan-y");
  await stage.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("+");
  if ((page.viewportSize()?.width ?? 0) <= 600) await expect(stage).toHaveCSS("touch-action", "none");
  const zoomed = await world.getAttribute("style");
  await page.keyboard.press("ArrowRight");
  await expect(world).not.toHaveAttribute("style", zoomed!);
  await page.keyboard.press("0");
  await expect(world).toHaveAttribute("style", /translate\(0px, 0px\)/);
  await page.getByRole("tab", { name: "Wipe", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Image comparison slider", exact: true });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");
  await page.getByRole("combobox", { name: "Sensitivity", exact: true }).selectOption("0");
  await expect(page.getByRole("link", { name: "Save image", exact: true })).toHaveAttribute("href", /^data:image\/png/);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("link", { name: "Save image", exact: true }).click();
  const png = await downloadedBytes(await downloaded);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.readUInt32BE(16)).toBe(1400);
  expect(png.readUInt32BE(20)).toBe(800);
});

test("different image dimensions retain transparent top-left padding", async ({ page }) => {
  const svg = (size: number, color: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${color}"/></svg>`;
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.svg", svg(8, "red"), "image/svg+xml"),
    textFile("modified.svg", svg(4, "blue"), "image/svg+xml"),
  ]);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.getByText(/Different dimensions\. Images keep their original size/)).toBeVisible();
  await expect(page.locator('.image-pair-canvas img').nth(1)).toHaveJSProperty("naturalWidth", 8);
  const pixels = await page.locator('.image-pair-canvas img').nth(1).evaluate((element) => {
    const image = element as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return {
      width: image.naturalWidth, height: image.naturalHeight,
      first: [...context.getImageData(0, 0, 1, 1).data],
      last: [...context.getImageData(7, 7, 1, 1).data],
    };
  });
  expect(pixels).toEqual({ width: 8, height: 8, first: [0, 0, 255, 255], last: [0, 0, 0, 0] });
});

test("PDF extraction uses local assets and permits exact-byte comparison", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== "127.0.0.1") external.push(request.url());
  });
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.pdf", pdf("Hello world"), "application/pdf"),
    textFile("modified.pdf", pdf("Hello friend"), "application/pdf"),
  ]);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.getByRole("heading", { name: "PDF page text changed", exact: true })).toBeVisible();
  await expect(page.locator(".diff-scroll")).toContainText("Hello friend");
  expect((await report(page)).type).toBe("pdf");
  await page.getByRole("combobox", { name: "Compare as", exact: true }).selectOption("bytes");
  await expect(page.getByRole("heading", { name: /bytes differ at matching offsets/ })).toBeVisible();
  expect(external).toEqual([]);
});

test("folder selection hashes relative paths and exports manifest changes", async ({ page }, testInfo) => {
  const original = testInfo.outputPath("original");
  const modified = testInfo.outputPath("modified");
  await mkdir(original, { recursive: true });
  await mkdir(modified, { recursive: true });
  await writeFile(`${original}/file.txt`, "before");
  await writeFile(`${modified}/file.txt`, "after");
  await writeFile(`${modified}/added.txt`, "new");
  await page.getByLabel("Folder selection", { exact: true }).setInputFiles(original);
  await expect(page.locator(".file-card")).toHaveCount(1);
  await page.getByLabel("Folder selection", { exact: true }).setInputFiles(modified);
  await expect(page.locator(".file-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Folder files changed", exact: true })).toBeVisible();
  const result = await report(page);
  expect(result.type).toBe("folder");
  expect(result.added).toBe(1);
  expect(result.changed).toBe(1);
});

test("unsupported text encoding retains byte comparison and fingerprints", async ({ page }) => {
  await page.getByLabel("File selection", { exact: true }).setInputFiles([
    textFile("original.txt", Buffer.from([255, 254, 65, 0])),
    textFile("modified.txt", Buffer.from([255, 254, 66, 0])),
  ]);
  await expect(page.locator(".file-card")).toHaveCount(2);
  await expect(page.locator(".error-banner")).toContainText("Loaded as Bytes");
  await page.getByRole("button", { name: "Compare files", exact: true }).click();
  await expect(page.getByRole("heading", { name: /1 bytes differ at matching offsets/ })).toBeVisible();
  const result = await report(page);
  expect(result.originalSize).toBe(4);
  expect(result.modifiedSize).toBe(4);
  expect(result.originalHash).not.toBe(result.modifiedHash);
});
