import type { ComparisonFile, FolderEntry } from "@/lib/types";
import {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FOLDER_FILES,
} from "@/lib/constants";
import { hashBytes } from "@/lib/comparison/binary";
import { generateId } from "@/lib/utils/file";

export function validateRelativePath(path: string) {
  if (
    !path ||
    path.length > 4096 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    path.includes("\0")
  )
    throw new Error("This folder contains an invalid relative file path.");
}
export async function processFolder(
  selected: FileList | File[],
  signal?: AbortSignal,
  progress?: (message: string) => void,
): Promise<ComparisonFile> {
  const files = Array.from(selected);
  if (!files.length)
    throw new Error("Choose a folder containing at least one file.");
  if (files.length > MAX_FOLDER_FILES)
    throw new Error("Folders support up to 1,000 files.");
  const paths = files.map((file) => file.webkitRelativePath || file.name);
  const root = paths[0].split("/")[0];
  if (paths.some((path) => !path.startsWith(`${root}/`)))
    throw new Error("Choose one folder at a time.");
  let total = 0;
  const entries: FolderEntry[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < files.length; i++) {
    signal?.throwIfAborted();
    const file = files[i];
    const path = paths[i].slice(root.length + 1);
    validateRelativePath(path);
    if (seen.has(path)) throw new Error(`Duplicate path: ${path}`);
    seen.add(path);
    total += file.size;
    if (file.size > MAX_FILE_SIZE || total > MAX_TOTAL_SIZE)
      throw new Error("Folders support 10 MB per file and 30 MB in total.");
    progress?.(`Checking file ${i + 1} of ${files.length}`);
    const hash = await hashBytes(new Uint8Array(await file.arrayBuffer()));
    signal?.throwIfAborted();
    entries.push({ path, size: file.size, hash });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    id: generateId(),
    name: root,
    type: "folder",
    size: total,
    mimeType: "application/x-diffs-folder",
    entries,
  };
}
