import assert from "node:assert/strict";
import { test } from "node:test";
import { hashBytes } from "../src/lib/comparison/binary.ts";
import { automaticMode } from "../src/lib/comparison/engine.ts";
import { MAX_FILE_SIZE } from "../src/lib/constants.ts";
import { validateSession } from "../src/lib/session.ts";
import { processFile } from "../src/lib/utils/file.ts";
import { inspectImage, validateStillImage } from "../src/lib/utils/image.ts";

const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
function chunk(type: string, payload = new Uint8Array()) {
  const bytes = new Uint8Array(payload.length + 12);
  new DataView(bytes.buffer).setUint32(0, payload.length);
  bytes.set(new TextEncoder().encode(type), 4);
  bytes.set(payload, 8);
  return bytes;
}
function png(...chunks: Uint8Array[]) {
  return new Uint8Array(Buffer.concat([signature, ...chunks]));
}

test("PNG animation metadata is checked before compressed image decoding", () => {
  assert.throws(() => validateStillImage(png(chunk("IHDR"), chunk("acTL"), chunk("IDAT"))), /Animated images/);
  assert.doesNotThrow(() => validateStillImage(png(chunk("IHDR"), chunk("IDAT"), chunk("IEND"))));
  // Strings in unrelated chunks must not be confused with an animation chunk.
  assert.doesNotThrow(() => validateStillImage(png(chunk("tEXt", new TextEncoder().encode("acTL")), chunk("IDAT"))));
});

test("PNG scanning skips large metadata and respects typed-array offsets", () => {
  const content = png(chunk("IHDR"), chunk("tEXt", new Uint8Array(10000)), chunk("acTL"));
  const wrapped = new Uint8Array(content.length + 20);
  wrapped.set(content, 7);
  assert.throws(() => validateStillImage(wrapped.subarray(7, 7 + content.length)), /Animated images/);
});

test("malformed PNG chunk lengths are rejected without reading outside input", () => {
  const invalid = chunk("tEXt");
  new DataView(invalid.buffer).setUint32(0, 0xffffffff);
  assert.throws(() => validateStillImage(png(invalid)), /invalid chunk length/);
  assert.doesNotThrow(() => validateStillImage(new Uint8Array([137, 80, 78])));
});

test("APNG is rejected by strict ingestion and available only as bytes with a notice", async () => {
  const content = png(chunk("IHDR"), chunk("acTL"), chunk("IDAT"));
  const file = new File([content], "animation.png", { type: "image/png" });
  await assert.rejects(processFile(file), /Animated images/);
  const notices: string[] = [];
  const result = await processFile(file, undefined, undefined, (reason) => notices.push(reason));
  assert.equal(result.type, "binary");
  assert.equal(result.dataUrl, undefined);
  assert.deepEqual(result.bytes, content);
  assert.match(notices[0], /still frame/);
});

test("UTF-16 fallback keeps the original filename, MIME, bytes and SHA-256", async () => {
  const bytes = Uint8Array.from([255, 254, 65, 0, 13, 0, 10, 0]);
  const notices: string[] = [];
  const file = new File([bytes], "original.txt", { type: "text/plain" });
  const result = await processFile(file, undefined, undefined, (reason) => notices.push(reason));
  assert.equal(result.type, "binary");
  assert.equal(result.name, file.name);
  assert.equal(result.mimeType, file.type);
  assert.equal(result.hash, await hashBytes(bytes));
  assert.deepEqual(result.bytes, bytes);
  assert.equal(result.textContent, undefined);
  assert.match(notices[0], /UTF-16/);
  assert.equal(automaticMode(result, result), "bytes");
  const restored = validateSession({ version: 2, files: [result], originalId: result.id, oldText: "", newText: "" });
  assert.deepEqual(restored.files[0], result);
});

test("text semantic limits still permit exact comparison within file-byte limits", async () => {
  for (const text of ["a".repeat(500001), "a\n".repeat(20001)]) {
    const notices: string[] = [];
    const result = await processFile(new File([text], "large.txt"), undefined, undefined, (reason) => notices.push(reason));
    assert.equal(result.type, "binary");
    assert.equal(result.bytes?.length, Buffer.byteLength(text));
    assert.equal(notices.length, 1);
    assert.match(notices[0], /500,000|20,000/);
  }
});

test("invalid UTF-8 and damaged PDF headers can fall back without losing bytes", async () => {
  for (const [name, bytes] of [["invalid.txt", Uint8Array.from([255])], ["damaged.pdf", Uint8Array.from([1, 2, 3])]] as const) {
    let notice = "";
    const result = await processFile(new File([bytes], name), undefined, undefined, (reason) => { notice = reason; });
    assert.equal(result.type, "binary");
    assert.deepEqual(result.bytes, bytes);
    assert.ok(notice);
    assert.equal(result.pages, undefined);
  }
});

test("valid UTF-8 and JSON keep their semantic types without fallback notices", async () => {
  for (const name of ["plain.txt", "data.json", "data.csv"]) {
    const notices: string[] = [];
    const result = await processFile(new File(["{}\n"], name), undefined, undefined, (reason) => notices.push(reason));
    assert.notEqual(result.type, "binary");
    assert.equal(result.textContent, "{}\n");
    assert.deepEqual(notices, []);
  }
});

test("byte limits and cancellation cannot be bypassed through fallback", async () => {
  let notices = 0;
  const fallback = () => { notices++; };
  await assert.rejects(processFile(new File([new Uint8Array(MAX_FILE_SIZE + 1)], "large.txt"), undefined, undefined, fallback), /10 MB/);
  const controller = new AbortController();
  const file = new File([Uint8Array.from([255])], "invalid.txt");
  const arrayBuffer = file.arrayBuffer.bind(file);
  file.arrayBuffer = async () => { const bytes = await arrayBuffer(); controller.abort(); return bytes; };
  await assert.rejects(processFile(file, controller.signal, undefined, fallback), { name: "AbortError" });
  assert.equal(notices, 0);
});

class ImageProbe {
  static latest: ImageProbe;
  naturalWidth = 20;
  naturalHeight = 10;
  src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() { ImageProbe.latest = this; }
}

test("cancelled image decoding releases handlers and rejects immediately", async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Image");
  Object.defineProperty(globalThis, "Image", { value: ImageProbe, configurable: true });
  t.after(() => { if (original) Object.defineProperty(globalThis, "Image", original); else Reflect.deleteProperty(globalThis, "Image"); });
  const controller = new AbortController();
  const pending = inspectImage("data:image/png;base64,AA==", false, controller.signal);
  const image = ImageProbe.latest;
  assert.ok(image.onload);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(image.src, "");
  assert.equal(image.onload, null);
  assert.equal(image.onerror, null);
});

test("successful still-image inspection also releases decode resources", async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Image");
  Object.defineProperty(globalThis, "Image", { value: ImageProbe, configurable: true });
  t.after(() => { if (original) Object.defineProperty(globalThis, "Image", original); else Reflect.deleteProperty(globalThis, "Image"); });
  const source = "data:image/png;base64,AA==";
  const pending = inspectImage(source);
  ImageProbe.latest.onload?.();
  assert.equal(await pending, source);
  assert.equal(ImageProbe.latest.onload, null);
  assert.equal(ImageProbe.latest.src, "");
});
