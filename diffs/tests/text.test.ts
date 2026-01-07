import test from "node:test";
import assert from "node:assert/strict";
import { applyPatch } from "diff";
import { computeTextComparison, createPatch, tokenizeLines } from "../src/lib/comparison/text.ts";
test("identical and empty text have accurate outcomes", () => {
  assert.equal(computeTextComparison("", "").identical, true);
  assert.equal(
    computeTextComparison("alpha\nbeta\n", "alpha\nbeta\n").equivalent,
    true,
  );
  assert.deepEqual(
    tokenizeLines("\n\n").map((line) => [line.text, line.ending]),
    [
      ["", "\n"],
      ["", "\n"],
    ],
  );
});
test("EOF and CRLF differences survive the result model", () => {
  const eof = computeTextComparison("hello\n", "hello");
  assert.equal(eof.equivalent, false);
  assert.ok(eof.lines[0].left);
  assert.ok(eof.lines[0].right);
  assert.equal(eof.lines[0].left.ending, "\n");
  assert.equal(eof.lines[0].right.ending, "");
  assert.equal(computeTextComparison("a\r\n", "a\n").equivalent, false);
  assert.deepEqual(
    tokenizeLines("a\rb\r").map((line) => line.ending),
    ["\r", "\r"],
  );
});
test("aligned rows preserve both sources and line numbers", () => {
  for (const [a, b] of [
    ["first\nold\nlast\n", "first\nnew\nextra\nlast\n"],
    ["", "new"],
    ["removed\n", ""],
    ["\n", "\n\n"],
    ["👩‍💻 café\n", "👩‍🔬 café\n"],
  ]) {
    const result = computeTextComparison(a, b);
    assert.equal(
      result.lines
        .map((line) => (line.left ? line.left.text + line.left.ending : ""))
        .join(""),
      a,
    );
    assert.equal(
      result.lines
        .map((line) => (line.right ? line.right.text + line.right.ending : ""))
        .join(""),
      b,
    );
    for (const side of ["left", "right"] as const)
      assert.deepEqual(
        result.lines.flatMap((line) => (line[side] ? [line[side].number] : [])),
        tokenizeLines(side === "left" ? a : b).map((line) => line.number),
      );
  }
});
test("whitespace normalization never claims exact identity", () => {
  const result = computeTextComparison("  alpha   beta\n", "alpha beta\n", {
    ignoreWhitespace: true,
  });
  assert.equal(result.identical, false);
  assert.equal(result.equivalent, true);
  assert.equal(result.normalized, true);
  assert.ok(result.lines[0].left);
  assert.equal(result.lines[0].left.text, "  alpha   beta");
});
test("long dissimilar lines use a bounded fallback", { timeout: 2000 }, () => {
  const start = performance.now();
  const result = computeTextComparison("a".repeat(10000), "b".repeat(10000));
  assert.equal(result.simplified, true);
  assert.equal(result.added, 1);
  assert.equal(result.removed, 1);
  assert.ok(performance.now() - start < 1000);
});
test(
  "pathological line edits preserve source content when alignment falls back",
  { timeout: 2000 },
  () => {
    const a = Array.from({ length: 4000 }, (_, index) => `old-${index}\n`).join(
      "",
    );
    const b = Array.from({ length: 4000 }, (_, index) => `new-${index}\n`).join(
      "",
    );
    const result = computeTextComparison(a, b);
    assert.equal(
      result.lines
        .map((line) => (line.left ? line.left.text + line.left.ending : ""))
        .join(""),
      a,
    );
    assert.equal(
      result.lines
        .map((line) => (line.right ? line.right.text + line.right.ending : ""))
        .join(""),
      b,
    );
  },
);
test("patches apply to the source including EOF markers and Unicode", () => {
  for (const [a, b] of [
    ["hello\n", "hello"],
    ["a\r\nb\r\n", "a\r\nnew\r\n"],
    ["", "new\n"],
    ["gone", ""],
    ["café\n", "👩‍💻\n"],
  ]) {
    const patch = createPatch(a, b, "original.txt", "modified.txt");
    assert.equal(applyPatch(a, patch), b);
  }
});
