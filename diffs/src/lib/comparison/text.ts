// ---------------------------------------------------------------------------
// Text diff logic — pure functions, no React
// ---------------------------------------------------------------------------

import * as Diff from "diff";
import type { TextDiffLine } from "@/lib/types";

/** Process two text strings into an aligned array of diff lines */
export function computeTextDiff(oldText: string, newText: string): TextDiffLine[] {
  const lineDiff = Diff.diffLines(oldText, newText);
  const processed: TextDiffLine[] = [];

  for (let i = 0; i < lineDiff.length; i++) {
    const part = lineDiff[i];
    const nextPart = lineDiff[i + 1];

    if (part.removed && nextPart?.added) {
      // Paired modification block
      const oldLines = splitLines(part.value);
      const newLines = splitLines(nextPart.value);
      const maxLen = Math.max(oldLines.length, newLines.length);

      for (let j = 0; j < maxLen; j++) {
        processed.push({
          type: "modification",
          oldLine: oldLines[j] ?? null,
          newLine: newLines[j] ?? null,
        });
      }
      i++; // skip the added part
    } else {
      const lines = splitLines(part.value);
      const type = part.added ? "added" : part.removed ? "removed" : "unchanged";
      for (const line of lines) {
        processed.push({ type, line });
      }
    }
  }

  return processed;
}

/** Compute character-level diff between two lines */
export function computeCharDiff(
  oldLine: string,
  newLine: string
): Diff.Change[] {
  return Diff.diffChars(oldLine, newLine);
}

/** Split on newlines, dropping the trailing empty string */
function splitLines(value: string): string[] {
  const lines = value.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}
