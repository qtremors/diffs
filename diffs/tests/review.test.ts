import assert from "node:assert/strict";
import test from "node:test";
import { computeTextComparison } from "../src/lib/comparison/text.ts";
import { changeBlocks, findTextMatches, findLineMatches, highlightedLine, MAX_SEARCH_MATCHES } from "../src/lib/comparison/review.ts";

test("find uses literal text, including regular expression punctuation", () => {
  const query = "[a].*+?^${}()|\\";
  const text = `${query} and ${query}`;
  assert.deepEqual(findTextMatches(text, query).matches, [
    { from: 0, to: query.length }, { from: query.length + 5, to: text.length },
  ]);
  assert.deepEqual(findTextMatches("abc", "").matches, []);
  assert.deepEqual(findTextMatches("abc", "abcd").matches, []);
});

test("case matching preserves Unicode and UTF-16 source offsets", () => {
  const text = "😀 Alpha alpha ALPHA";
  const found = findTextMatches(text, "alpha");
  assert.deepEqual(found.matches.map((match) => text.slice(match.from, match.to)), ["Alpha", "alpha", "ALPHA"]);
  assert.equal(found.matches[0].from, 3);
  assert.deepEqual(findTextMatches(text, "alpha", true).matches, [{ from: 9, to: 14 }]);
  assert.deepEqual(findTextMatches("İIıi", "i").matches, [{ from: 1, to: 2 }, { from: 3, to: 4 }]);
});

test("find counts non-overlapping occurrences and bounds pathological match output", () => {
  assert.deepEqual(findTextMatches("aaaaa", "aa").matches, [{ from: 0, to: 2 }, { from: 2, to: 4 }]);
  assert.equal(findTextMatches("aa", "a", false, 2).truncated, false);
  assert.equal(findTextMatches("aaa", "a", false, 2).truncated, true);
  const found = findTextMatches("x".repeat(500000), "x");
  assert.equal(found.matches.length, MAX_SEARCH_MATCHES);
  assert.equal(found.truncated, true);
});

test("line matches respect source side, repeated rows, whitespace and case", () => {
  const result = computeTextComparison("  Same\nold\nSame\n", " Same\nnew\nSame\n");
  assert.deepEqual(findLineMatches(result.lines, "original", "Same", true).matches,
    [{ row: 0, from: 2, to: 6 }, { row: 2, from: 0, to: 4 }]);
  assert.deepEqual(findLineMatches(result.lines, "modified", "Same", true).matches,
    [{ row: 0, from: 1, to: 5 }, { row: 2, from: 0, to: 4 }]);
  assert.equal(findLineMatches(result.lines, "modified", "old", false).matches.length, 0);
  assert.equal(findLineMatches(result.lines, "original", "old", false).matches.length, 1);
});

test("match limits apply across lines, including exactly-at-limit results", () => {
  const result = computeTextComparison("x\n".repeat(2500), "x\n".repeat(2500));
  assert.equal(findLineMatches(result.lines, "modified", "x", false).matches.length, MAX_SEARCH_MATCHES);
  assert.equal(findLineMatches(result.lines, "modified", "x", false).truncated, true);
  assert.equal(findLineMatches(result.lines.slice(0, MAX_SEARCH_MATCHES), "modified", "x", false).truncated, false);
});

test("find highlights layer over character changes without losing source text", () => {
  const line = { text: "abcdef", ending: "\r\n", number: 1, spans: [
    { value: "ab", changed: false }, { value: "cd", changed: true }, { value: "ef", changed: false },
  ] };
  const matches = findTextMatches(line.text, "bcde").matches;
  const parts = highlightedLine(line, matches, matches[0]);
  assert.equal(parts.map((part) => part.value).join(""), line.text);
  assert.equal(parts.filter((part) => part.matched).map((part) => part.value).join(""), "bcde");
  assert.equal(parts.filter((part) => part.changed).map((part) => part.value).join(""), "cd");
  assert.equal(parts.filter((part) => part.current).map((part) => part.value).join(""), "bcde");
  assert.equal(line.ending, "\r\n");
});

test("changed blocks copy exact original and modified slices including CRLF and EOF", () => {
  const original = "keep\r\n  old \t\r\ncontext\r\nlast old";
  const modified = "keep\r\n new  \r\ncontext\r\nlast new";
  const blocks = changeBlocks(computeTextComparison(original, modified).lines);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].original, "  old \t\r\n");
  assert.equal(blocks[0].modified, " new  \r\n");
  assert.equal(blocks[1].original, "last old");
  assert.equal(blocks[1].modified, "last new");
  for (const block of blocks) {
    assert.equal(original.slice(block.fromA, block.toA), block.original);
    assert.equal(modified.slice(block.fromB, block.toB), block.modified);
  }
});

test("added and removed blocks have empty ranges on their absent side", () => {
  for (const [original, modified] of [["", "added\n"], ["removed\n", ""]]) {
    const [block] = changeBlocks(computeTextComparison(original, modified).lines);
    assert.equal(block.original, original);
    assert.equal(block.modified, modified);
    assert.equal(block.toA - block.fromA, original.length);
    assert.equal(block.toB - block.fromB, modified.length);
  }
  assert.deepEqual(changeBlocks(computeTextComparison("same", "same").lines), []);
});

test("ignored whitespace never rewrites the text copied from a changed block", () => {
  const result = computeTextComparison("  old \n", "\tnew\t\n", { ignoreWhitespace: true });
  const [block] = changeBlocks(result.lines);
  assert.equal(block.original, "  old \n");
  assert.equal(block.modified, "\tnew\t\n");
  assert.deepEqual(changeBlocks(computeTextComparison(" a \n", "\ta\n", { ignoreWhitespace: true }).lines), []);
});
