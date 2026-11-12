import assert from "node:assert/strict";
import test from "node:test";
import { constrainImagePan } from "../src/lib/utils/image.ts";

test("fitted images remain centered when pointer or keyboard pan is requested", () => {
  assert.deepEqual(constrainImagePan(
    { x: 100, y: -100 }, { width: 400, height: 200 }, { width: 800, height: 480 }, 1,
  ), { x: 0, y: 0 });
});

test("zoomed images permit movement to every edge with a small visible margin", () => {
  const image = { width: 1000, height: 800 };
  const viewport = { width: 600, height: 400 };
  assert.deepEqual(constrainImagePan({ x: Infinity, y: Infinity }, image, viewport, 2), { x: 720, y: 620 });
  assert.deepEqual(constrainImagePan({ x: -Infinity, y: -Infinity }, image, viewport, 2), { x: -720, y: -620 });
  assert.deepEqual(constrainImagePan({ x: 40, y: -160 }, image, viewport, 2), { x: 40, y: -160 });
});

test("panning is bounded independently on horizontal and vertical axes", () => {
  const image = { width: 2000, height: 100 };
  const viewport = { width: 800, height: 600 };
  assert.deepEqual(constrainImagePan({ x: 100, y: 100 }, image, viewport, 1), { x: 100, y: 0 });
  assert.deepEqual(constrainImagePan({ x: -10000, y: -10000 }, image, viewport, 1), { x: -620, y: 0 });
});

test("returning from high zoom to fit removes unreachable pan offsets", () => {
  const image = { width: 1600, height: 1200 };
  const viewport = { width: 375, height: 400 };
  const panned = constrainImagePan({ x: 10000, y: 10000 }, image, viewport, 8);
  assert.ok(panned.x > 0 && panned.y > 0);
  const fitScale = Math.min(1, (viewport.width - 40) / image.width, (viewport.height - 40) / image.height);
  assert.deepEqual(constrainImagePan(panned, image, viewport, fitScale), { x: 0, y: 0 });
});

test("viewport growth and side-by-side width changes constrain old offsets", () => {
  const image = { width: 1000, height: 1000 };
  const current = constrainImagePan({ x: 200, y: 200 }, image, { width: 400, height: 400 }, 1);
  assert.deepEqual(constrainImagePan(current, image, { width: 1200, height: 1200 }, 1), { x: 0, y: 0 });
  assert.equal(constrainImagePan(current, { ...image, width: 2024 }, { width: 1200, height: 1200 }, 1).x, 200);
});
