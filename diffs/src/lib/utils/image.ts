// ---------------------------------------------------------------------------
// Image/canvas utilities
// ---------------------------------------------------------------------------

import type { ImageMetadata } from "@/lib/types";

interface CanvasResult {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  img: HTMLImageElement;
}

/** Load an image source into a canvas and extract its ImageData */
export function loadImageToCanvas(src: string): Promise<CanvasResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas 2D context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ canvas, ctx, imageData, img });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/** Extract metadata from a loaded image and its source file */
export function getImageMetadata(
  file: { name: string; size: number; type: string },
  img: HTMLImageElement
): ImageMetadata {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);

  return {
    width: w,
    height: h,
    fileSize: file.size,
    format: file.type || "unknown",
    aspectRatio: `${w / d}:${h / d}`,
  };
}
