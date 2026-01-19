import type { PdfComparisonResult, ChangeKind } from "@/lib/types";
export function comparePdfPages(
  original: string[],
  modified: string[],
): PdfComparisonResult {
  const pageStates: ChangeKind[] = Array.from(
    { length: Math.max(original.length, modified.length) },
    (_, i) =>
      i >= original.length
        ? "added"
        : i >= modified.length
          ? "removed"
          : original[i] === modified[i]
            ? "same"
            : "changed",
  );
  const counts = { added: 0, removed: 0, changed: 0, same: 0 };
  pageStates.forEach((state) => counts[state]++);
  return {
    type: "pdf",
    originalPages: original,
    modifiedPages: modified,
    pageStates,
    ...counts,
    equivalent: !counts.added && !counts.removed && !counts.changed,
    hasOriginalText: original.some((page) => page.trim()),
    hasModifiedText: modified.some((page) => page.trim()),
  };
}
