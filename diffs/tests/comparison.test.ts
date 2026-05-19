import test from "node:test";
import assert from "node:assert/strict";
import { applyPatch } from "diff";
import {
  computeTextComparison,
  createPatch,
  tokenizeLines,
} from "../src/lib/comparison/text.ts";
import {
  decodeText,
  processFile,
  detectFileType,
  loadedFileSize,
} from "../src/lib/utils/file.ts";
import { validateImageDimensions } from "../src/lib/utils/image.ts";
import { validateSession, persistSession } from "../src/lib/utils/storage.ts";

const bytes = (text: string) => new TextEncoder().encode(text).buffer;
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
test("binary and invalid UTF-8 are rejected without lossy conversion", () => {
  assert.throws(() => decodeText(new Uint8Array([0x80]).buffer), /UTF-8/);
  assert.throws(() => decodeText(new Uint8Array([0x81]).buffer), /UTF-8/);
  assert.throws(
    () => decodeText(new Uint8Array([65, 0, 66]).buffer),
    /binary|UTF-16/,
  );
  assert.equal(decodeText(bytes("café 👩‍💻\r\n")), "café 👩‍💻\r\n");
  assert.equal(
    detectFileType({ name: "document.pdf", type: "application/pdf" }),
    "pdf",
  );
});
test("size and text budgets are enforced at ingestion", async () => {
  await assert.rejects(
    processFile(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.txt", {
        type: "text/plain",
      }),
    ),
    /10 MB/,
  );
  assert.throws(() => computeTextComparison("x".repeat(500001), ""), /500,000/);
  assert.throws(() => computeTextComparison("x\n".repeat(20001), ""), /20,000/);
});
test("images reject zero dimensions and decoded pixel overflows", () => {
  assert.throws(() => validateImageDimensions(0, 10), /no visible pixels/);
  assert.throws(() => validateImageDimensions(4096, 4096), /8 megapixels/);
  assert.throws(() => validateImageDimensions(20000, 1), /16,384/);
  assert.doesNotThrow(() => validateImageDimensions(1200, 800));
});
test("restore preserves order and repairs a missing baseline", () => {
  const files = ["z", "a"].map((id) => ({
    id,
    type: "text",
    name: id,
    size: 1,
    mimeType: "text/plain",
    textContent: id,
  }));
  const result = validateSession({
    version: 1,
    files,
    originalId: "missing",
    oldText: "",
    newText: "",
    mode: "files",
  });
  assert.deepEqual(
    result.files.map((file) => file.id),
    ["z", "a"],
  );
  assert.equal(result.originalId, "z");
  assert.throws(
    () =>
      validateSession({
        version: 1,
        files: [...files, files[0]],
        oldText: "",
        newText: "",
      }),
    /invalid/,
  );
  assert.throws(
    () => validateSession({ version: 9, files, oldText: "", newText: "" }),
    /unsupported/,
  );
});

test("animated image headers are rejected before decoding", async () => {
  const webp = new Uint8Array(32);
  webp.set(new TextEncoder().encode("RIFF"), 0);
  webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
  webp[20] = 2;
  await assert.rejects(
    processFile(new File([webp], "animated.webp", { type: "image/webp" })),
    /Animated/,
  );
  const avif = new Uint8Array(32);
  avif.set(new TextEncoder().encode("ftypavis"), 4);
  await assert.rejects(
    processFile(new File([avif], "animated.avif", { type: "image/avif" })),
    /Animated/,
  );
});

test("restore sanitizes source fields and budgets rendered image payloads", () => {
  const source = {
    id: "source",
    name: "source.txt",
    type: "text",
    mimeType: "text/plain",
    textContent: "x",
    size: 1,
    dataUrl: { unexpected: true },
  };
  const clean = validateSession({
    version: 1,
    files: [source],
    originalId: "source",
    oldText: "",
    newText: "",
  });
  assert.equal(clean.files[0].dataUrl, undefined);
  const payload = `data:image/png;base64,${"a".repeat(11 * 1024 * 1024)}`;
  const files = Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    name: `${i}.svg`,
    type: "image",
    mimeType: "image/svg+xml",
    size: 100,
    dataUrl: payload,
  }));
  assert.throws(
    () => validateSession({ version: 1, files, oldText: "", newText: "" }),
    /session limit/,
  );
});

test("unsupported drafts are rejected before accessing browser storage", async () => {
  await assert.rejects(
    persistSession(
      {
        files: [],
        originalId: null,
        oldText: "x".repeat(500001),
        newText: "",
        mode: "text",
        pasteFormat: "text",
      },
      true,
    ),
    /500,000/,
  );
});

test("image byte budgets exclude data URL headers and base64 padding", () => {
  const base = {
    id: "image",
    name: "image.png",
    type: "image" as const,
    mimeType: "image/png",
    size: 1,
  };
  assert.equal(
    loadedFileSize({ ...base, dataUrl: "data:image/png;base64,AQID" }),
    3,
  );
  assert.equal(
    loadedFileSize({ ...base, dataUrl: "data:image/png;base64,AQI=" }),
    2,
  );
  assert.equal(
    loadedFileSize({ ...base, dataUrl: "data:image/png;base64,AQ==" }),
    1,
  );
});
