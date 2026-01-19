import type { BinaryComparisonResult } from "@/lib/types";
export async function hashBytes(bytes: Uint8Array): Promise<string> {
  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer),
  );
  return Array.from(hash, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}
export async function compareBytes(
  original: Uint8Array,
  modified: Uint8Array,
): Promise<BinaryComparisonResult> {
  const ranges: { start: number; end: number }[] = [];
  let differentBytes = 0;
  let start = -1;
  let rangeCount = 0;
  for (let i = 0; i <= Math.max(original.length, modified.length); i++) {
    const different =
      i < Math.max(original.length, modified.length) &&
      original[i] !== modified[i];
    if (different) {
      differentBytes++;
      if (start < 0) start = i;
    } else if (start >= 0) {
      rangeCount++;
      if (ranges.length < 2000) ranges.push({ start, end: i });
      start = -1;
    }
  }
  const [originalHash, modifiedHash] = await Promise.all([
    hashBytes(original),
    hashBytes(modified),
  ]);
  return {
    type: "binary",
    identical: !differentBytes,
    differentBytes,
    originalHash,
    modifiedHash,
    originalSize: original.length,
    modifiedSize: modified.length,
    ranges,
    rangeCount,
  };
}
