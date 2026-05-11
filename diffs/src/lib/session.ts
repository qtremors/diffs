import type { SessionData, ComparisonFile } from "@/lib/types";
import {
  MAX_FILES,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FOLDER_FILES,
  MAX_PDF_PAGES,
  MAX_TEXT_LENGTH,
} from "@/lib/constants";
import { loadedFileSize } from "@/lib/utils/file";
import { validateRelativePath } from "@/lib/utils/folder";
import { validateText } from "@/lib/comparison/text";

export function validateSession(value: unknown): SessionData {
  if (!value || typeof value !== "object")
    throw new Error("The saved session could not be restored.");
  const data = value as Record<string, unknown>;
  if (
    (data.version !== 1 && data.version !== 2) ||
    !Array.isArray(data.files) ||
    data.files.length > MAX_FILES ||
    typeof data.oldText !== "string" ||
    typeof data.newText !== "string"
  )
    throw new Error("The saved session uses an unsupported format.");
  validateText(data.oldText);
  validateText(data.newText);
  const ids = new Set<string>();
  let total = 0;
  const files = data.files.map((value: unknown): ComparisonFile => {
    if (!value || typeof value !== "object")
      throw new Error("A saved file is invalid.");
    const file = value as ComparisonFile;
    if (
      typeof file.id !== "string" ||
      ids.has(file.id) ||
      typeof file.name !== "string" ||
      typeof file.mimeType !== "string" ||
      !Number.isInteger(file.size) ||
      file.size < 0 ||
      file.size > (file.type === "folder" ? MAX_TOTAL_SIZE : MAX_FILE_SIZE)
    )
      throw new Error("A saved file is invalid.");
    ids.add(file.id);
    let clean: ComparisonFile;
    const base = {
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
    };
    if (
      file.hash !== undefined &&
      (typeof file.hash !== "string" || !/^[a-f0-9]{64}$/.test(file.hash))
    )
      throw new Error("A saved fingerprint is invalid.");
    if (
      file.bytes !== undefined &&
      (!(file.bytes instanceof Uint8Array) ||
        file.bytes.length !== file.size ||
        file.bytes.length > MAX_FILE_SIZE)
    )
      throw new Error("A saved file is invalid.");
    const fingerprint = file.bytes
      ? { bytes: file.bytes, hash: file.hash }
      : {};
    if (
      ["text", "json", "table"].includes(file.type) &&
      typeof file.textContent === "string"
    ) {
      validateText(file.textContent);
      clean = {
        ...base,
        ...fingerprint,
        type: file.type,
        textContent: file.textContent,
      };
    } else if (
      file.type === "image" &&
      typeof file.dataUrl === "string" &&
      /^data:image\//.test(file.dataUrl) &&
      file.dataUrl.length <= MAX_FILE_SIZE * 1.4 + 1000
    ) {
      clean = { ...base, ...fingerprint, type: "image", dataUrl: file.dataUrl };
    } else if (file.type === "binary" && file.bytes) {
      clean = { ...base, ...fingerprint, type: "binary" };
    } else if (
      file.type === "pdf" &&
      file.bytes &&
      Array.isArray(file.pages) &&
      file.pages.length > 0 &&
      file.pages.length <= MAX_PDF_PAGES
    ) {
      let length = 0;
      for (const page of file.pages) {
        if (typeof page !== "string")
          throw new Error("A saved PDF is invalid.");
        validateText(page);
        length += page.length;
      }
      if (length > MAX_TEXT_LENGTH)
        throw new Error("A saved PDF exceeds the text limit.");
      clean = { ...base, ...fingerprint, type: "pdf", pages: file.pages };
    } else if (
      file.type === "folder" &&
      Array.isArray(file.entries) &&
      file.entries.length <= MAX_FOLDER_FILES
    ) {
      const paths = new Set<string>();
      let size = 0;
      const entries = file.entries.map((entry) => {
        if (
          !entry ||
          typeof entry.path !== "string" ||
          !Number.isInteger(entry.size) ||
          entry.size < 0 ||
          entry.size > MAX_FILE_SIZE ||
          typeof entry.hash !== "string" ||
          !/^[a-f0-9]{64}$/.test(entry.hash)
        )
          throw new Error("A saved folder is invalid.");
        validateRelativePath(entry.path);
        if (paths.has(entry.path))
          throw new Error("A saved folder has duplicate paths.");
        paths.add(entry.path);
        size += entry.size;
        return { path: entry.path, size: entry.size, hash: entry.hash };
      });
      if (size !== file.size) throw new Error("A saved folder is invalid.");
      clean = { ...base, type: "folder", entries };
    } else throw new Error("A saved file is invalid.");
    total += loadedFileSize(clean);
    return clean;
  });
  if (total > MAX_TOTAL_SIZE)
    throw new Error("The saved files exceed the session limit.");
  return {
    files,
    originalId: files.some((file) => file.id === data.originalId)
      ? String(data.originalId)
      : (files[0]?.id ?? null),
    oldText: data.oldText,
    newText: data.newText,
    mode: data.mode === "text" ? "text" : "files",
    pasteFormat:
      data.pasteFormat === "json" || data.pasteFormat === "table"
        ? data.pasteFormat
        : "text",
  };
}
