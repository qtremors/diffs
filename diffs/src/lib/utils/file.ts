// ---------------------------------------------------------------------------
// File utilities — reading, type detection, MIME helpers
// ---------------------------------------------------------------------------

import type { FileType } from "@/lib/types";
import {
  TEXT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  TEXT_EXTENSIONS,
  IMAGE_EXTENSIONS,
} from "@/lib/constants";

/** Detect the comparison-relevant file type from a File object */
export function detectFileType(file: File): FileType {
  // Try MIME type first
  if (TEXT_MIME_TYPES.has(file.type)) return "text";
  if (IMAGE_MIME_TYPES.has(file.type)) return "image";

  // Fallback to extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (TEXT_EXTENSIONS.has(ext)) return "text";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";

  // Text-like MIME prefix fallback
  if (file.type.startsWith("text/")) return "text";
  if (file.type.startsWith("image/")) return "image";

  return "unknown";
}

/** Read a file as UTF-8 text */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

/** Read a file as a data URL (base64) */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/** Generate a short unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
