import {
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
  MAX_FILE_SIZE,
} from "@/lib/constants";
import type { ImageMetadata } from "@/lib/types";

export function validateImageDimensions(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error("This image has no visible pixels.");
  if (
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  )
    throw new Error(
      "Images must be under 8 megapixels and 16,384 pixels on each side.",
    );
}

/** SVG blobs cannot be decoded by ImageBitmap in every browser. Rasterize once on ingestion. */
export function inspectImage(src: string, rasterize = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const fail = (error: unknown) => {
      clearTimeout(timer);
      reject(error);
    };
    const done = (value: string) => {
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      image.src = "";
      fail(new Error("Image loading took too long. Try a smaller image."));
    }, 10_000);
    image.onload = () => {
      try {
        validateImageDimensions(image.naturalWidth, image.naturalHeight);
        if (!rasterize) {
          done(src);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context)
          throw new Error(
            "This browser cannot render SVG images. Export a PNG instead.",
          );
        context.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob || blob.size > MAX_FILE_SIZE) {
            fail(
              new Error(
                "The rendered SVG is too large. Export a smaller PNG instead.",
              ),
            );
            return;
          }
          const reader = new FileReader();
          reader.onload = () => done(String(reader.result));
          reader.onerror = () =>
            fail(
              new Error("The SVG could not be rendered. Export a PNG instead."),
            );
          reader.readAsDataURL(blob);
        }, "image/png");
      } catch (error) {
        fail(error);
      }
    };
    image.onerror = () =>
      fail(
        new Error(
          "Your browser could not open this image. Try exporting it as PNG.",
        ),
      );
    image.src = src;
  });
}

export function getImageMetadata(
  file: { size: number; mimeType: string },
  width: number,
  height: number,
): ImageMetadata {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height);
  return {
    width,
    height,
    fileSize: file.size,
    format: file.mimeType || "Image",
    aspectRatio: `${width / divisor}:${height / divisor}`,
  };
}
