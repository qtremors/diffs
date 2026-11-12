import {
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
  MAX_FILE_SIZE,
} from "@/lib/constants";
import type { ImageMetadata } from "@/lib/types";

/** Keep every edge reachable without allowing the image to be dragged away. */
export function constrainImagePan(
  position: { x: number; y: number },
  image: { width: number; height: number },
  viewport: { width: number; height: number },
  scale: number,
) {
  const horizontal = Math.max(0, (image.width * scale - viewport.width) / 2 + 20);
  const vertical = Math.max(0, (image.height * scale - viewport.height) / 2 + 20);
  return {
    x: horizontal === 0 ? 0 : Math.max(-horizontal, Math.min(horizontal, position.x)),
    y: vertical === 0 ? 0 : Math.max(-vertical, Math.min(vertical, position.y)),
  };
}

/** Check container metadata before asking a browser decoder for a still frame. */
export function validateStillImage(bytes: Uint8Array) {
  const header = bytes.subarray(0, 128);
  const signature = new TextDecoder("latin1").decode(header);
  const animated = () => {
    throw new Error("Animated images are not supported. Export a still frame first.");
  };
  if (
    (signature.startsWith("RIFF") && signature.slice(8, 12) === "WEBP" &&
      signature.slice(12, 16) === "VP8X" && (header[20] & 2)) ||
    (signature.slice(4, 8) === "ftyp" && signature.includes("avis"))
  ) animated();

  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!png.every((value, index) => bytes[index] === value)) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    if (length > bytes.length - offset - 12)
      throw new Error("This PNG contains an invalid chunk length.");
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    // APNG requires acTL before the first IDAT. Do not scan compressed pixels.
    if (type === "acTL") animated();
    if (type === "IDAT" || type === "IEND") return;
    offset += length + 12;
  }
}

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
export function inspectImage(
  src: string,
  rasterize = false,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const image = new Image();
    let settled = false;
    let reader: FileReader | undefined;
    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      image.onload = null;
      image.onerror = null;
      image.src = "";
      if (reader && reader.readyState === FileReader.LOADING) reader.abort();
    };
    const fail = (error: unknown) => {
      if (settled) return;
      cleanup();
      reject(error);
    };
    const done = (value: string) => {
      if (settled) return;
      cleanup();
      resolve(value);
    };
    const abort = () => fail(new DOMException("Cancelled", "AbortError"));
    const timer = setTimeout(
      () => fail(new Error("Image loading took too long. Try a smaller image.")),
      10_000,
    );
    signal?.addEventListener("abort", abort, { once: true });
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
          if (settled) return;
          if (!blob || blob.size > MAX_FILE_SIZE) {
            fail(
              new Error(
                "The rendered SVG is too large. Export a smaller PNG instead.",
              ),
            );
            return;
          }
          const pendingReader = new FileReader();
          reader = pendingReader;
          reader.onload = () => done(String(pendingReader.result));
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
