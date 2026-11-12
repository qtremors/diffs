import type { ComparisonFile, FileType } from "@/lib/types";
import {
  TEXT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  TEXT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_TEXT_LENGTH,
} from "@/lib/constants";
import { hashBytes } from "@/lib/comparison/binary";
import { inspectImage, validateStillImage } from "@/lib/utils/image";
import { validateText } from "@/lib/comparison/text";

export function detectFileType(file: { name: string; type: string }): FileType {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || file.type === "application/pdf") return "pdf";
  if (IMAGE_MIME_TYPES.has(file.type) || IMAGE_EXTENSIONS.has(ext))
    return "image";
  if (ext === "json" || file.type === "application/json") return "json";
  if (
    ["csv", "tsv"].includes(ext) ||
    ["text/csv", "text/tab-separated-values"].includes(file.type)
  )
    return "table";
  if (
    TEXT_MIME_TYPES.has(file.type) ||
    file.type.startsWith("text/") ||
    TEXT_EXTENSIONS.has(ext)
  )
    return "text";
  return "binary";
}

export function decodeText(bytes: ArrayBuffer): string {
  const data = new Uint8Array(bytes);
  if (data.some((value) => value === 0))
    throw new Error("This looks like a binary or UTF-16 file. Use UTF-8 text.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("This file is not valid UTF-8 text.");
  }
  if (/[\u0001-\u0008\u000e-\u001f]/.test(text))
    throw new Error(
      "This looks like a binary file. Choose text or a supported image.",
    );
  if (text.length > MAX_TEXT_LENGTH)
    throw new Error("Text files must contain fewer than 500,000 characters.");
  validateText(text);
  return text;
}

export function readFileAsDataUrl(file: Blob, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const reader = new FileReader();
    const abort = () => reader.abort();
    reader.onloadend = () => signal?.removeEventListener("abort", abort);
    signal?.addEventListener("abort", abort, { once: true });
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("This file could not be read. Try selecting it again."));
    reader.onabort = () => reject(new Error("File reading was cancelled."));
    reader.readAsDataURL(file);
  });
}

export async function processFile(
  file: File,
  signal?: AbortSignal,
  progress?: (message: string) => void,
  onByteFallback?: (reason: string) => void,
): Promise<ComparisonFile> {
  if (file.size > MAX_FILE_SIZE)
    throw new Error("Files must be 10 MB or smaller.");
  signal?.throwIfAborted();
  const type = detectFileType(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const original: ComparisonFile = {
    id: generateId(),
    name: file.name,
    type: "binary",
    size: file.size,
    mimeType: file.type,
    bytes,
    hash: await hashBytes(bytes),
  };
  signal?.throwIfAborted();
  const result = { ...original, type };
  try {
    if (["text", "json", "table"].includes(type))
      result.textContent = decodeText(bytes.buffer);
    else if (type === "pdf") {
      if (
        !new TextDecoder("latin1")
          .decode(bytes.subarray(0, 1024))
          .includes("%PDF-")
      )
        throw new Error("This file does not have a valid PDF header.");
      const { extractPdf } = await import("@/lib/utils/pdf");
      result.pages = await extractPdf(bytes, signal, progress);
    } else if (type === "image") {
      validateStillImage(bytes);
      const extension = file.name.split(".").pop()?.toLowerCase();
      const mime = IMAGE_MIME_TYPES.has(file.type)
        ? file.type
        : extension === "svg"
          ? "image/svg+xml"
          : extension === "jpg"
            ? "image/jpeg"
            : `image/${extension}`;
      result.mimeType = mime;
      result.dataUrl = await inspectImage(
        await readFileAsDataUrl(new Blob([file], { type: mime }), signal),
        mime === "image/svg+xml",
        signal,
      );
    }
  } catch (error) {
    signal?.throwIfAborted();
    if (!onByteFallback) throw error;
    onByteFallback(error instanceof Error ? error.message : "This format could not be decoded.");
    return original;
  }
  signal?.throwIfAborted();
  return result;
}

export function generateId(): string {
  return crypto.randomUUID();
}
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function downloadFile(
  content: Blob | string,
  name: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(
    typeof content === "string" ? new Blob([content], { type }) : content,
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Include a rasterized SVG's payload in the session budget, while preserving original file metadata. */
export function loadedFileSize(file: ComparisonFile): number {
  if (!file.dataUrl) return file.size;
  const content = file.dataUrl.slice(file.dataUrl.indexOf(",") + 1);
  const padding = content.endsWith("==") ? 2 : content.endsWith("=") ? 1 : 0;
  return Math.max(file.size, Math.floor(content.length * 0.75) - padding);
}
