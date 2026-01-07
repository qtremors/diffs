import { diffArrays, diffChars, createTwoFilesPatch } from "diff";
import type {
  TextLine,
  TextDiffLine,
  TextOptions,
  TextComparisonResult,
} from "@/lib/types";
import { MAX_TEXT_LENGTH, MAX_TEXT_LINES } from "@/lib/constants";

export function tokenizeLines(text: string): TextLine[] {
  const lines: TextLine[] = [];
  const pattern = /([^\r\n]*)(\r\n|\r|\n|$)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) && match[0] !== "") {
    lines.push({ text: match[1], ending: match[2], number: lines.length + 1 });
  }
  return lines;
}

export function validateText(text: string) {
  if (text.length > MAX_TEXT_LENGTH)
    throw new Error("Keep text under 500,000 characters per side.");
  if (tokenizeLines(text).length > MAX_TEXT_LINES)
    throw new Error("Keep text under 20,000 lines per side.");
}

export function computeTextComparison(
  oldText: string,
  newText: string,
  options: TextOptions = { ignoreWhitespace: false },
): TextComparisonResult {
  validateText(oldText);
  validateText(newText);
  const left = tokenizeLines(oldText);
  const right = tokenizeLines(newText);
  const normalize = (line: TextLine) =>
    (options.ignoreWhitespace
      ? line.text.replace(/[\t ]+/g, " ").trim()
      : line.text) + line.ending;
  const changes = diffArrays(left, right, {
    comparator: (a, b) => normalize(a) === normalize(b),
    timeout: 300,
    maxEditLength: 3000,
  });
  const lines: TextDiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  let simplified = !changes;
  const charDeadline = Date.now() + 250;
  const append = (oldLines: TextLine[], newLines: TextLine[]) => {
    for (let j = 0; j < Math.max(oldLines.length, newLines.length); j++) {
      const a = oldLines[j] ? { ...oldLines[j] } : null;
      const b = newLines[j] ? { ...newLines[j] } : null;
      if (
        a &&
        b &&
        a.text !== b.text &&
        a.text.length + b.text.length < 4000 &&
        Date.now() < charDeadline
      ) {
        const spans = diffChars(a.text, b.text, {
          timeout: 8,
          maxEditLength: 300,
        });
        if (spans) {
          a.spans = spans
            .filter((s) => !s.added)
            .map((s) => ({ value: s.value, changed: !!s.removed }));
          b.spans = spans
            .filter((s) => !s.removed)
            .map((s) => ({ value: s.value, changed: !!s.added }));
        } else simplified = true;
      } else if (a && b && a.text !== b.text) simplified = true;
      lines.push({
        type: a && b ? "changed" : a ? "removed" : "added",
        left: a,
        right: b,
      });
    }
  };
  if (!changes) append(left, right);
  else
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const count = change.value.length;
      if (change.removed) {
        const next = changes[i + 1];
        if (next?.added) {
          append(
            left.slice(oldIndex, oldIndex + count),
            right.slice(newIndex, newIndex + next.value.length),
          );
          oldIndex += count;
          newIndex += next.value.length;
          i++;
        } else {
          append(left.slice(oldIndex, oldIndex + count), []);
          oldIndex += count;
        }
      } else if (change.added) {
        append([], right.slice(newIndex, newIndex + count));
        newIndex += count;
      } else {
        for (let j = 0; j < count; j++)
          lines.push({
            type: "unchanged",
            left: left[oldIndex++],
            right: right[newIndex++],
          });
      }
    }
  return {
    type: "text",
    lines,
    normalized: options.ignoreWhitespace,
    identical: oldText === newText,
    equivalent: lines.every((line) => line.type === "unchanged"),
    simplified,
    added: lines.filter((line) => line.type !== "unchanged" && line.right)
      .length,
    removed: lines.filter((line) => line.type !== "unchanged" && line.left)
      .length,
  };
}

export function createPatch(
  oldText: string,
  newText: string,
  originalName: string,
  modifiedName: string,
): string {
  validateText(oldText);
  validateText(newText);
  const safeName = (name: string) => name.replace(/[\r\n\t]/g, "_");
  const patch = createTwoFilesPatch(
    safeName(originalName),
    safeName(modifiedName),
    oldText,
    newText,
    "",
    "",
    { context: 3, timeout: 1000, maxEditLength: 6000 },
  );
  if (!patch)
    throw new Error(
      "This change is too large to export as a patch. Try smaller files.",
    );
  return patch;
}
