import { readFile } from "node:fs/promises";
import { test as base, expect, type Download, type Page } from "@playwright/test";

export const test = base.extend<{ pageErrors: void }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await use();
    expect(errors, "Unexpected browser exceptions").toEqual([]);
  }, { auto: true }],
});
export { expect };

export const textFile = (name: string, content: string | Buffer, mimeType = "text/plain") => ({
  name, mimeType, buffer: typeof content === "string" ? Buffer.from(content) : content,
});

export async function openWorkspace(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("checkbox", { name: "Remember this tab", exact: true })).toBeEnabled();
}

export async function example(page: Page) {
  await page.getByRole("button", { name: "Try an example" }).click();
  await expect(page.getByRole("heading", { name: "JSON fields changed", exact: true })).toBeVisible();
}

export async function downloadedBytes(download: Download) {
  const path = await download.path();
  if (!path) throw new Error("Download did not complete");
  return readFile(path);
}

export async function report(page: Page) {
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Report", exact: true }).click();
  const result = JSON.parse((await downloadedBytes(await downloaded)).toString("utf8"));
  expect(result.format).toBe("diffs-report");
  expect(result.version).toBe(1);
  return result.comparison;
}

export async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    (page.viewportSize()?.width ?? 0) + 1,
  );
}

export function pdf(text: string) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let source = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(source));
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = Buffer.byteLength(source);
  source += "xref\n0 6\n0000000000 65535 f \n";
  source += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  source += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(source);
}
