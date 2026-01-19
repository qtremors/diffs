import type {
  FolderEntry,
  FolderComparisonResult,
  FolderChange,
} from "@/lib/types";
export function compareFolders(
  original: FolderEntry[],
  modified: FolderEntry[],
): FolderComparisonResult {
  const a = new Map(original.map((entry) => [entry.path, entry]));
  const b = new Map(modified.map((entry) => [entry.path, entry]));
  const entries: FolderChange[] = [...new Set([...a.keys(), ...b.keys()])]
    .sort()
    .map((path) => {
      const before = a.get(path) ?? null;
      const after = b.get(path) ?? null;
      return {
        path,
        before,
        after,
        kind: !before
          ? "added"
          : !after
            ? "removed"
            : before.hash === after.hash && before.size === after.size
              ? "same"
              : "changed",
      };
    });
  const counts = { added: 0, removed: 0, changed: 0, same: 0 };
  entries.forEach((entry) => counts[entry.kind]++);
  return {
    type: "folder",
    entries,
    ...counts,
    equivalent: !counts.added && !counts.removed && !counts.changed,
  };
}
