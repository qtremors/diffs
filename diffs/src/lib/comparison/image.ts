import pixelmatch from "pixelmatch";
import type { ComparisonFile, ImageDiffResult } from "@/lib/types";
import { getImageMetadata, validateImageDimensions } from "@/lib/utils/image";

async function toDataUrl(canvas: OffscreenCanvas): Promise<string> {
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return `data:image/png;base64,${btoa(binary)}`;
}

export async function computeImageDiff(
  original: ComparisonFile,
  modified: ComparisonFile,
  threshold: number,
): Promise<ImageDiffResult> {
  if (!original.dataUrl || !modified.dataUrl)
    throw new Error("The image source is missing. Select the file again.");
  const load = async (url: string) =>
    createImageBitmap(await (await fetch(url)).blob());
  let a: ImageBitmap | undefined;
  let b: ImageBitmap | undefined;
  try {
    // Decode sequentially so a failed second decode cannot leak the first bitmap.
    a = await load(original.dataUrl);
    b = await load(modified.dataUrl);
    validateImageDimensions(a.width, a.height);
    validateImageDimensions(b.width, b.height);
    const width = Math.max(a.width, b.width);
    const height = Math.max(a.height, b.height);
    validateImageDimensions(width, height);
    const rasterize = (image: ImageBitmap) => {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context)
        throw new Error("Image comparison is not available in this browser.");
      context.drawImage(image, 0, 0);
      return { canvas, pixels: context.getImageData(0, 0, width, height) };
    };
    const left = rasterize(a);
    const right = rasterize(b);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Image comparison is not available in this browser.");
    const output = context.createImageData(width, height);
    const diffPixelCount = pixelmatch(
      left.pixels.data,
      right.pixels.data,
      output.data,
      width,
      height,
      {
        threshold,
        includeAA: true,
        diffMask: true,
        diffColor: [255, 255, 255],
        diffColorAlt: [255, 255, 255],
        alpha: 0.18,
      },
    );
    context.putImageData(output, 0, 0);
    const [diffDataUrl, originalDataUrl, modifiedDataUrl] = await Promise.all([
      toDataUrl(canvas),
      toDataUrl(left.canvas),
      toDataUrl(right.canvas),
    ]);
    return {
      original: getImageMetadata(original, a.width, a.height),
      modified: getImageMetadata(modified, b.width, b.height),
      width,
      height,
      totalPixels: width * height,
      diffPixelCount,
      diffPercentage: (diffPixelCount / (width * height)) * 100,
      diffDataUrl,
      originalDataUrl,
      modifiedDataUrl,
      threshold,
      dimensionsMatch: a.width === b.width && a.height === b.height,
    };
  } finally {
    a?.close();
    b?.close();
  }
}
