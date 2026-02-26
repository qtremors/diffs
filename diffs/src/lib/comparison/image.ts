// ---------------------------------------------------------------------------
// Image diff logic — metadata extraction + pixel-level comparison
// ---------------------------------------------------------------------------

import pixelmatch from "pixelmatch";
import type { ImageDiffResult } from "@/lib/types";
import { loadImageToCanvas, getImageMetadata } from "@/lib/utils/image";
import { PIXEL_DIFF_THRESHOLD } from "@/lib/constants";

interface ImageFileInfo {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

/** Run a full image comparison: metadata + pixel diff */
export async function computeImageDiff(
  original: ImageFileInfo,
  modified: ImageFileInfo
): Promise<ImageDiffResult> {
  const [origResult, modResult] = await Promise.all([
    loadImageToCanvas(original.dataUrl),
    loadImageToCanvas(modified.dataUrl),
  ]);

  const origMeta = getImageMetadata(original, origResult.img);
  const modMeta = getImageMetadata(modified, modResult.img);

  // Use the larger dimensions as the comparison canvas size
  const width = Math.max(origResult.canvas.width, modResult.canvas.width);
  const height = Math.max(origResult.canvas.height, modResult.canvas.height);

  // Resize both images to the comparison canvas size
  const origData = resizeImageData(origResult, width, height);
  const modData = resizeImageData(modResult, width, height);

  // Create output canvas for the diff
  const diffCanvas = document.createElement("canvas");
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext("2d");
  if (!diffCtx) throw new Error("Failed to create diff canvas context");

  const diffOutput = diffCtx.createImageData(width, height);
  const totalPixels = width * height;

  const diffPixelCount = pixelmatch(
    origData.data,
    modData.data,
    diffOutput.data,
    width,
    height,
    { threshold: PIXEL_DIFF_THRESHOLD }
  );

  diffCtx.putImageData(diffOutput, 0, 0);

  return {
    original: origMeta,
    modified: modMeta,
    diffDataUrl: diffCanvas.toDataURL("image/png"),
    diffPixelCount,
    diffPercentage: totalPixels > 0 ? (diffPixelCount / totalPixels) * 100 : 0,
    totalPixels,
  };
}

/** Resize image data to a target size by drawing onto a new canvas */
function resizeImageData(
  result: { canvas: HTMLCanvasElement },
  targetWidth: number,
  targetHeight: number
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create resize canvas context");

  // Fill with transparent black first
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  // Draw original canvas at its native size (top-left aligned)
  ctx.drawImage(result.canvas, 0, 0);

  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}
