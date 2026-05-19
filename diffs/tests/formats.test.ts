import test from "node:test";
import type { ComparisonFile } from "../src/lib/types.ts";
import assert from "node:assert/strict";
import { compareJson, parseJson } from "../src/lib/comparison/json.ts";
import {
  compareTables,
  parseDelimited,
  detectDelimiter,
} from "../src/lib/comparison/table.ts";
import { compareBytes, hashBytes } from "../src/lib/comparison/binary.ts";
import { compareFolders } from "../src/lib/comparison/folder.ts";
import { comparePdfPages } from "../src/lib/comparison/pdf.ts";
import {
  processFolder,
  validateRelativePath,
} from "../src/lib/utils/folder.ts";
import { processFile, detectFileType } from "../src/lib/utils/file.ts";
import { validateSession } from "../src/lib/utils/storage.ts";
import { automaticMode } from "../src/lib/comparison/engine.ts";
const tableOptions = { delimiter: "auto" as const, headers: true, keyColumn: null };
const encode = (s: string) => new TextEncoder().encode(s);

test("JSON fields ignore object order and numeric spelling without rounding", () => {
  assert.equal(
    compareJson('{"b":1e3,"a":0.00}', '{ "a": -0, "b": 1000 }').equivalent,
    true,
  );
  assert.equal(
    compareJson('{"n":9007199254740992}', '{"n":9007199254740993}').changed,
    1,
  );
  assert.equal(
    compareJson("1e9999999999999999999", "10e9999999999999999998").equivalent,
    true,
  );
  assert.equal(compareJson('"a"', '"\\u0061"').equivalent, true);
});
test("JSON retains raw values and unambiguous JSON Pointer paths", () => {
  const diff = compareJson(
    '{"a/b":{"~":1},"gone":false,"":0}',
    '{"a/b":{"~":2},"new":null,"":true}',
  );
  assert.deepEqual(
    diff.changes.map((c) => c.path),
    ["/a~1b/~0", "/gone", "/", "/new"],
  );
  assert.ok(diff.changes[0].after);
  assert.equal(diff.changes[0].after.raw, "2");
  assert.equal(compareJson("null", "false").changes[0].path, "");
  assert.equal(compareJson("[1,2]", "[2,1]").changed, 2);
  assert.equal(compareJson('{"__proto__":1}', '{"__proto__":2}').changed, 1);
});
test("ambiguous or malformed JSON fails clearly and nesting is bounded", () => {
  for (const invalid of [
    '{"a":1,"a":2}',
    '{"a":1,"\\u0061":2}',
    "[1,]",
    "01",
    "1.",
    "true false",
    '"unclosed',
    '{"x":NaN}',
    '{"x":1,}',
  ])
    assert.throws(() => parseJson(invalid));
  assert.throws(
    () => parseJson("[".repeat(102) + "0" + "]".repeat(102)),
    /100 levels/,
  );
  assert.throws(() => compareJson("{}", "invalid"), /Modified:/);
});
test("CSV parsing preserves quotes, embedded newlines, and empty fields", () => {
  assert.deepEqual(
    parseDelimited(
      'name,note\r\n"a,b","line1\r\nline2"\r\n"quote""ok",\r\n',
      ",",
    ),
    [
      ["name", "note"],
      ["a,b", "line1\r\nline2"],
      ['quote"ok', ""],
    ],
  );
  assert.deepEqual(parseDelimited('\n""\n\n', ","), [[""]]);
  assert.throws(() => parseDelimited('a\n"unclosed', ","), /Unclosed/);
  assert.throws(() => parseDelimited('a\n"done"tail', ","), /Unexpected/);
});
test("table delimiter detection supports TSV, semicolon and pipe", () => {
  for (const delimiter of ["\t", ";", "|", ","])
    assert.equal(
      detectDelimiter(`id${delimiter}name\n1${delimiter}a\n`),
      delimiter,
    );
  assert.equal(detectDelimiter("a\nb", "data.tsv"), "\t");
  assert.equal(
    compareTables(
      "id\tname\n1\ta",
      "id,name\n1,a",
      tableOptions,
      "a.tsv",
      "b.csv",
    ).equivalent,
    true,
  );
});
test("keyed tables follow reordered rows and columns without losing changes", () => {
  const a = "id,name\n1,A\n2,B\n3,C";
  const b = "name,id\nBee,2\nA,1\nD,4";
  const result = compareTables(a, b, { ...tableOptions, keyColumn: "id" });
  assert.deepEqual(
    [result.same, result.changed, result.added, result.removed],
    [1, 1, 1, 1],
  );
  const changedRow = result.rows.find((r) => r.key === "2");
  const matchingRow = result.rows.find((r) => r.key === "1");
  assert.ok(changedRow);
  assert.ok(matchingRow);
  assert.deepEqual(changedRow.changedColumns, ["name"]);
  assert.equal(matchingRow.modifiedRow, 2);
  assert.equal(
    compareTables(a, "name,id\nC,3\nB,2\nA,1", {
      ...tableOptions,
      keyColumn: "id",
    }).equivalent,
    true,
  );
  assert.equal(
    compareTables(a, "id,name\n2,B\n1,A\n3,C", tableOptions).changed,
    2,
  );
});
test("table schema changes, absent cells and prototype headings stay distinct", () => {
  assert.equal(compareTables("a\n", "b\n", tableOptions).equivalent, false);
  const result = compareTables(
    "__proto__,constructor\na,b",
    "__proto__,new\na,",
    tableOptions,
  );
  assert.deepEqual(result.rows[0].changedColumns, ["constructor", "new"]);
  assert.ok(result.rows[0].before);
  assert.ok(result.rows[0].after);
  assert.equal(Object.hasOwn(result.rows[0].before, "__proto__"), true);
  assert.equal(result.rows[0].after.new, "");
  assert.equal(
    compareTables("a,b\nx,y", "a,b\nx,y", { ...tableOptions, headers: false })
      .same,
    2,
  );
});
test("malformed tables never silently discard records", () => {
  assert.throws(
    () => compareTables("a,b\n1", "a,b\n1,2", tableOptions),
    /expected 2/,
  );
  assert.throws(
    () => compareTables("a,a\n1,2", "a,b\n1,2", tableOptions),
    /unique/,
  );
  assert.throws(
    () =>
      compareTables("id,v\n1,a\n1,b", "id,v\n1,c", {
        ...tableOptions,
        keyColumn: "id",
      }),
    /keys.*unique/,
  );
  assert.throws(
    () =>
      compareTables("id,v\n,a", "id,v\n1,c", {
        ...tableOptions,
        keyColumn: "id",
      }),
    /nonempty/,
  );
  assert.throws(
    () =>
      compareTables("a\n1", "a\n1", { ...tableOptions, keyColumn: "missing" }),
    /missing/,
  );
  assert.throws(
    () => parseDelimited(Array(202).fill("x").join(","), ","),
    /200 columns/,
  );
});
test("SHA-256 hashes original bytes including encodings and newline differences", async () => {
  assert.equal(
    await hashBytes(encode("abc")),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.notEqual(
    await hashBytes(encode("a\r\n")),
    await hashBytes(encode("a\n")),
  );
  const result = await processFile(
    new File([new Uint8Array([0, 255, 1])], "archive.zip", {
      type: "application/zip",
    }),
  );
  assert.equal(result.type, "binary");
  assert.ok(result.bytes);
  assert.deepEqual([...result.bytes], [0, 255, 1]);
  assert.equal(result.hash, await hashBytes(result.bytes));
  const bom = await processFile(
    new File([new Uint8Array([239, 187, 191, 97])], "bom.txt", {
      type: "text/plain",
    }),
  );
  assert.equal(bom.textContent, "a");
  assert.notEqual(bom.hash, await hashBytes(encode("a")));
});
test("byte comparison finds substitutions, tails and bounded range details", async () => {
  const result = await compareBytes(
    new Uint8Array([0, 1, 2, 3]),
    new Uint8Array([0, 9, 2, 9, 0]),
  );
  assert.deepEqual(result.ranges, [
    { start: 1, end: 2 },
    { start: 3, end: 5 },
  ]);
  assert.equal(result.differentBytes, 3);
  assert.equal(
    (await compareBytes(new Uint8Array(), new Uint8Array())).identical,
    true,
  );
  const a = new Uint8Array(10000),
    b = Uint8Array.from(a, (_, i) => i % 2);
  const bounded = await compareBytes(a, b);
  assert.equal(bounded.rangeCount, 5000);
  assert.equal(bounded.ranges.length, 2000);
  assert.equal(bounded.differentBytes, 5000);
});
test("folder snapshots compare exact relative paths, bytes and additions", async () => {
  const hash = await hashBytes(encode("same"));
  const changedHash = await hashBytes(encode("else"));
  const entry = (path: string, h = hash) => ({ path, size: 4, hash: h });
  const result = compareFolders(
    [entry("A"), entry("same"), entry("changed")],
    [entry("a"), entry("same"), entry("changed", changedHash)],
  );
  assert.deepEqual(
    [result.same, result.changed, result.added, result.removed],
    [1, 1, 1, 1],
  );
  for (const path of ["/a", "../a", "a/../b", "a//b", "a\\b", "a/\0b"])
    assert.throws(() => validateRelativePath(path), /invalid/);
  const f = new File(["same"], "data.bin");
  Object.defineProperty(f, "webkitRelativePath", {
    value: "root/nested/data.bin",
  });
  const snapshot = await processFolder([f]);
  assert.equal(snapshot.name, "root");
  assert.ok(snapshot.entries);
  assert.equal(snapshot.entries[0].path, "nested/data.bin");
  assert.equal(snapshot.entries[0].hash, hash);
  assert.equal(snapshot.bytes, undefined);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(processFolder([f], controller.signal), {
    name: "AbortError",
  });
});
test("PDF page summaries distinguish absent pages from blank scanned text", () => {
  const result = comparePdfPages(["one", "two"], ["one", "edited", ""]);
  assert.deepEqual(result.pageStates, ["same", "changed", "added"]);
  assert.equal(result.equivalent, false);
  const scanned = comparePdfPages([""], [""]);
  assert.equal(scanned.equivalent, true);
  assert.equal(scanned.hasOriginalText, false);
});
test("format routing and unknown files retain a useful exact-byte fallback", () => {
  assert.equal(detectFileType({ name: "data.json", type: "" }), "json");
  assert.equal(detectFileType({ name: "data.tsv", type: "" }), "table");
  assert.equal(detectFileType({ name: "book.xlsx", type: "" }), "binary");
  const source = (fields: Partial<ComparisonFile>): ComparisonFile => ({
    id: "test", name: "test", size: 0, mimeType: "", type: "binary", ...fields,
  });
  assert.equal(
    automaticMode(
      source({ type: "json", textContent: "{}" }),
      source({ type: "text", textContent: "{}" }),
    ),
    "text",
  );
  assert.equal(automaticMode(source({ type: "pdf" }), source({ type: "pdf" })), "pdf");
  assert.equal(automaticMode(source({ type: "image" }), source({ type: "binary" })), "bytes");
});
test("versioned snapshots retain bytes and folder manifests but reject invalid fields", async () => {
  const binary = await processFile(
    new File([new Uint8Array([1, 2, 3])], "data.bin"),
  );
  const session = {
    version: 2,
    files: [binary],
    oldText: "{}",
    newText: "{}",
    pasteFormat: "json",
  };
  const clean = validateSession(session);
  assert.deepEqual(clean.files[0].bytes, binary.bytes);
  assert.equal(clean.pasteFormat, "json");
  assert.throws(
    () =>
      validateSession({
        ...session,
        files: [{ ...binary, bytes: new Uint8Array(2) }],
      }),
    /invalid/,
  );
  assert.throws(
    () => validateSession({ ...session, files: [{ ...binary, hash: "bad" }] }),
    /invalid/,
  );
  const folder = {
    id: "folder",
    name: "root",
    type: "folder",
    mimeType: "application/x-diffs-folder",
    size: 3,
    entries: [{ path: "a", size: 3, hash: binary.hash }],
  };
  const restoredEntries = validateSession({ ...session, files: [folder] }).files[0].entries;
  assert.ok(restoredEntries);
  assert.equal(restoredEntries[0].hash, binary.hash);
  assert.throws(
    () =>
      validateSession({
        ...session,
        files: [
          { ...folder, entries: [{ ...folder.entries[0], path: "../a" }] },
        ],
      }),
    /invalid/,
  );
  assert.throws(
    () => validateSession({ ...session, files: [{ ...folder, size: 4 }] }),
    /invalid/,
  );
});

test("JSON result budgets bound repeated long paths", () => {
  const key = "x".repeat(10000);
  const source = (values: number[]) => JSON.stringify({ [key]: values });
  assert.throws(
    () => compareJson(source(Array(250).fill(0)), source(Array(250).fill(1))),
    /result limit/,
  );
});
