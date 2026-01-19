import type {
  ComparisonFile,
  ComparisonOptions,
  ComparisonResult,
} from "@/lib/types";
import { runWorker } from "@/lib/comparison/client";
import { DEFAULT_TABLE_OPTIONS, PIXEL_DIFF_THRESHOLD } from "@/lib/constants";

export function automaticMode(a: ComparisonFile, b: ComparisonFile): string {
  if (a.type === "folder" && b.type === "folder") return "folder";
  if (a.type === "pdf" && b.type === "pdf") return "pdf";
  if (a.type === "image" && b.type === "image") return "image";
  if (a.textContent !== undefined && b.textContent !== undefined) {
    if (a.type === b.type && (a.type === "json" || a.type === "table"))
      return a.type;
    return "text";
  }
  return "bytes";
}
export async function compare(
  a: ComparisonFile,
  b: ComparisonFile,
  options: ComparisonOptions = {},
  signal?: AbortSignal,
): Promise<ComparisonResult> {
  const mode =
    !options.mode || options.mode === "auto"
      ? automaticMode(a, b)
      : options.mode;
  if (mode === "folder" && a.entries && b.entries)
    return runWorker(
      { kind: "folder", original: a.entries, modified: b.entries },
      signal,
    );
  if (mode === "pdf" && a.pages && b.pages)
    return runWorker(
      { kind: "pdf", original: a.pages, modified: b.pages },
      signal,
    );
  if (mode === "image")
    return runWorker(
      {
        kind: "image",
        original: { ...a, bytes: undefined },
        modified: { ...b, bytes: undefined },
        threshold: options.imageThreshold ?? PIXEL_DIFF_THRESHOLD,
      },
      signal,
    );
  if (mode === "bytes" && a.bytes && b.bytes)
    return runWorker(
      { kind: "bytes", original: a.bytes, modified: b.bytes },
      signal,
    );
  if (a.textContent !== undefined && b.textContent !== undefined) {
    if (mode === "json")
      return runWorker(
        { kind: "json", oldText: a.textContent, newText: b.textContent },
        signal,
      );
    if (mode === "table")
      return runWorker(
        {
          kind: "table",
          oldText: a.textContent,
          newText: b.textContent,
          options: options.table ?? DEFAULT_TABLE_OPTIONS,
          originalName: a.name,
          modifiedName: b.name,
        },
        signal,
      );
    if (mode === "text")
      return runWorker(
        {
          kind: "text",
          oldText: a.textContent,
          newText: b.textContent,
          options: { ignoreWhitespace: false },
        },
        signal,
      );
  }
  return {
    type: "error",
    reason:
      "These sources cannot use this comparison. Choose two folders, or two files with original bytes available. Reselect older saved files to enable byte comparison.",
  };
}
