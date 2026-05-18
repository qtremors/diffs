import test from "node:test";
import assert from "node:assert/strict";
import {
  editorDiff,
  normalizedEditorText,
} from "../src/lib/comparison/editor.ts";

const apply = (a: string, b: string, changes: ReturnType<typeof editorDiff>) => {
  let output = "",
    position = 0;
  for (const change of changes) {
    assert.ok(change.fromA >= position);
    assert.ok(change.toA >= change.fromA);
    assert.ok(change.toB >= change.fromB);
    output +=
      a.slice(position, change.fromA) + b.slice(change.fromB, change.toB);
    position = change.toA;
  }
  return output + a.slice(position);
};
test("editable diff ranges preserve raw UTF-16 source positions", () => {
  for (const [a, b] of [
    ["old\nkeep\n", "new\nkeep\n"],
    ["", "added"],
    ["removed", ""],
    ["👩‍💻 café\r\n", "👩‍🔬 café\r\n"],
    ["a\r\nb\n", "a\nb\n"],
    ["hello\n", "hello"],
  ])
    assert.equal(apply(a, b, editorDiff(a, b, false)), b);
});
test("whitespace review maps highlights back without rewriting the documents", () => {
  for (const [a, b] of [
    ["  alpha   beta\n", "alpha beta\n"],
    ["\told   value  \nkeep", " new value\nkeep  "],
    ["\u2003old\u2003\n", "new\n"],
    [" a b ", "ab"],
    ["\n\n", " \n\n"],
    ["  👩‍💻 café\r\n", "👩‍🔬 café\r\n"],
    [" \t", "value"],
  ]) {
    const updated = apply(a, b, editorDiff(a, b, true));
    assert.equal(
      normalizedEditorText(updated).text,
      normalizedEditorText(b).text,
    );
  }
  assert.equal(editorDiff("  alpha   beta\n", "alpha beta\n", true).length, 0);
  assert.notEqual(editorDiff("a b", "ab", true).length, 0);
  assert.notEqual(editorDiff("a\n", "a", true).length, 0);
});
test("normalization maps each surviving character to its source range", () => {
  const normalized = normalizedEditorText(" \tx   y  \r\n");
  assert.equal(normalized.text, "x y\r\n");
  assert.deepEqual(normalized.starts, [2, 3, 6, 9, 10]);
  assert.deepEqual(normalized.ends, [3, 6, 7, 10, 11]);
});
test(
  "pathological editor inputs use bounded diffing",
  { timeout: 2000 },
  () => {
    const a = "a".repeat(100000),
      b = "b".repeat(100000);
    assert.equal(apply(a, b, editorDiff(a, b, false)), b);
    assert.equal(editorDiff("x".repeat(500001), "", false).length, 1);
  },
);
