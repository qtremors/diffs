import type { TextDiffLine, TextLine } from "@/lib/types";

export type TextSide = "original" | "modified";
export interface TextMatch { from: number; to: number }
export interface LineMatch extends TextMatch { row: number }
export const MAX_SEARCH_MATCHES = 2000;

/** Literal, non-overlapping matches with offsets into the untouched UTF-16 source. */
function literalPattern(query: string, matchCase: boolean) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, matchCase ? "gu" : "giu");
}

function scan(text: string, pattern: RegExp, limit: number) {
  const matches: TextMatch[] = [];
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (matches.length >= limit) return { matches, truncated: true };
    matches.push({ from: match.index, to: match.index + match[0].length });
  }
  return { matches, truncated: false };
}

export function findTextMatches(text: string, query: string, matchCase = false, limit = MAX_SEARCH_MATCHES) {
  if (!query || query.length > text.length) return { matches: [] as TextMatch[], truncated: false };
  return scan(text, literalPattern(query, matchCase), limit);
}

export function findLineMatches(lines: readonly TextDiffLine[], side: TextSide, query: string, matchCase: boolean) {
  const matches: LineMatch[] = [];
  if (!query) return { matches, truncated: false };
  const pattern = literalPattern(query, matchCase);
  for (let row = 0; row < lines.length; row++) {
    const line = side === "original" ? lines[row].left : lines[row].right;
    if (!line) continue;
    const found = scan(line.text, pattern, MAX_SEARCH_MATCHES - matches.length);
    matches.push(...found.matches.map((match) => ({ ...match, row })));
    if (found.truncated) return { matches, truncated: true };
  }
  return { matches, truncated: false };
}

export interface ChangeBlock {
  startRow: number;
  endRow: number;
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
  original: string;
  modified: string;
}

/** Contiguous review changes retain each side's exact whitespace and line endings. */
export function changeBlocks(lines: readonly TextDiffLine[]): ChangeBlock[] {
  const blocks: ChangeBlock[] = [];
  let originalOffset = 0;
  let modifiedOffset = 0;
  let current: ChangeBlock | undefined;
  lines.forEach((line, row) => {
    const original = line.left ? line.left.text + line.left.ending : "";
    const modified = line.right ? line.right.text + line.right.ending : "";
    if (line.type === "unchanged") current = undefined;
    else {
      if (!current) {
        current = { startRow: row, endRow: row + 1, fromA: originalOffset, toA: originalOffset,
          fromB: modifiedOffset, toB: modifiedOffset, original: "", modified: "" };
        blocks.push(current);
      }
      current.endRow = row + 1;
      current.original += original;
      current.modified += modified;
      current.toA += original.length;
      current.toB += modified.length;
    }
    originalOffset += original.length;
    modifiedOffset += modified.length;
  });
  return blocks;
}

/** Layer find highlights over existing character changes without changing text. */
export function highlightedLine(line: TextLine, matches: readonly TextMatch[], active?: TextMatch) {
  const spans = line.spans ?? [{ value: line.text, changed: false }];
  const boundaries = new Set([0, line.text.length]);
  let offset = 0;
  const changes = spans.map((span) => {
    const from = offset;
    offset += span.value.length;
    boundaries.add(offset);
    return { from, to: offset, changed: span.changed };
  });
  for (const match of matches) { boundaries.add(match.from); boundaries.add(match.to); }
  const points = [...boundaries].sort((a, b) => a - b);
  let spanIndex = 0;
  let matchIndex = 0;
  return points.slice(0, -1).map((from, index) => {
    while (spanIndex + 1 < changes.length && changes[spanIndex].to <= from) spanIndex++;
    while (matchIndex < matches.length && matches[matchIndex].to <= from) matchIndex++;
    const match = matches[matchIndex];
    return {
      value: line.text.slice(from, points[index + 1]),
      changed: changes[spanIndex]?.changed ?? false,
      matched: !!match && match.from <= from && match.to > from,
      current: !!active && active.from <= from && active.to > from,
    };
  });
}
