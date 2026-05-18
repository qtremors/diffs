import { Change, diff } from "@codemirror/merge";
import { tokenizeLines } from "@/lib/comparison/text";
import { MAX_TEXT_LENGTH } from "@/lib/constants";

/** Normalize for review while mapping every UTF-16 position back to untouched source. */
export function normalizedEditorText(source: string) {
  const starts: number[] = [];
  const ends: number[] = [];
  const characters: string[] = [];
  let offset = 0;
  const append = (character: string, start: number, end: number) => {
    characters.push(character);
    starts.push(start);
    ends.push(end);
  };
  for (const line of tokenizeLines(source)) {
    const start = line.text.length - line.text.trimStart().length;
    const end = line.text.trimEnd().length;
    for (let i = start; i < end; i++) {
      if (line.text[i] === " " || line.text[i] === "\t") {
        const from = i;
        while (i + 1 < end && /[\t ]/.test(line.text[i + 1])) i++;
        append(" ", offset + from, offset + i + 1);
      } else append(line.text[i], offset + i, offset + i + 1);
    }
    for (let i = 0; i < line.ending.length; i++)
      append(
        line.ending[i],
        offset + line.text.length + i,
        offset + line.text.length + i + 1,
      );
    offset += line.text.length + line.ending.length;
  }
  return { text: characters.join(""), starts, ends, length: source.length };
}

export function editorDiff(
  a: string,
  b: string,
  ignoreWhitespace: boolean,
): readonly Change[] {
  if (a.length > MAX_TEXT_LENGTH || b.length > MAX_TEXT_LENGTH)
    return [new Change(0, a.length, 0, b.length)];
  const config = { scanLimit: 500, timeout: 40 };
  if (!ignoreWhitespace) return diff(a, b, config);
  const left = normalizedEditorText(a),
    right = normalizedEditorText(b);
  const range = (
    source: ReturnType<typeof normalizedEditorText>,
    from: number,
    to: number,
  ) => {
    const start = source.starts[from] ?? source.length;
    return [
      start,
      from === to ? start : (source.ends[to - 1] ?? source.length),
    ];
  };
  return diff(left.text, right.text, config).map((change) => {
    const [fromA, toA] = range(left, change.fromA, change.toA);
    const [fromB, toB] = range(right, change.fromB, change.toB);
    return new Change(fromA, toA, fromB, toB);
  });
}
