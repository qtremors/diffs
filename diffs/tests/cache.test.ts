import assert from "node:assert/strict";
import test from "node:test";
import { trimImageResults } from "../src/lib/comparison/cache.ts";
import type { ComparisonPair } from "../src/lib/types.ts";

function imagePair(id: string, characters = 100): ComparisonPair {
  const source = { id, name: `${id}.png`, type: "image" as const, mimeType: "image/png", size: 10 };
  const metadata = { width: 10, height: 10, fileSize: 10, format: "image/png", aspectRatio: "1:1" };
  return {
    original: { ...source, id: "original" }, modified: source,
    options: { imageThreshold: 0.2 }, resultOptions: { imageThreshold: 0.2 },
    result: { type: "image", diff: {
      original: metadata, modified: metadata, width: 10, height: 10,
      totalPixels: 100, diffPixelCount: 0, diffPercentage: 0, dimensionsMatch: true, threshold: 0.2,
      originalDataUrl: "a".repeat(characters), modifiedDataUrl: "b".repeat(characters), diffDataUrl: "c".repeat(characters),
    } },
  };
}

test("small image results preserve the existing cache and object identities", () => {
  const pairs = [imagePair("a"), imagePair("b")];
  assert.equal(trimImageResults(pairs, "b", ["a", "b"], 1200), pairs);
});

test("image eviction follows access order rather than source order", () => {
  const pairs = [imagePair("a"), imagePair("b"), imagePair("c")];
  const trimmed = trimImageResults(pairs, "c", ["b", "a", "c"], 1200);
  assert.equal(trimmed[0], pairs[0]);
  assert.equal(trimmed[1].result, null);
  assert.equal(trimmed[1].resultOptions, undefined);
  assert.equal(trimmed[1].options, pairs[1].options);
  assert.equal(trimmed[1].modified, pairs[1].modified);
  assert.equal(trimmed[2], pairs[2]);
  assert.notEqual(pairs[1].result, null);
});

test("the visible result is preserved even if it alone exceeds the cache budget", () => {
  const pairs = [imagePair("active", 1000), imagePair("other")];
  const trimmed = trimImageResults(pairs, "active", ["other", "active"], 10);
  assert.equal(trimmed[0], pairs[0]);
  assert.equal(trimmed[1].result, null);
  assert.equal(trimImageResults([pairs[0]], "active", ["active"], 10)[0], pairs[0]);
});

test("image pruning preserves non-image results and their comparison options", () => {
  const bytes: ComparisonPair = { ...imagePair("bytes"), result: {
    type: "binary", identical: true, differentBytes: 0, originalHash: "a", modifiedHash: "a",
    originalSize: 10, modifiedSize: 10, ranges: [], rangeCount: 0,
  } };
  const pairs = [imagePair("old"), bytes, imagePair("active")];
  const trimmed = trimImageResults(pairs, "active", ["old", "bytes", "active"], 600);
  assert.equal(trimmed[0].result, null);
  assert.equal(trimmed[1], bytes);
  assert.equal(trimmed[2], pairs[2]);
});

test("unvisited images are evicted first and empty workspaces need no changes", () => {
  const pairs = [imagePair("unvisited"), imagePair("recent"), imagePair("active")];
  assert.equal(trimImageResults(pairs, "active", ["recent", "active"], 1200)[0].result, null);
  const empty: ComparisonPair[] = [];
  assert.equal(trimImageResults(empty, "", []), empty);
});
