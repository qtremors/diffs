// ---------------------------------------------------------------------------
// Comparison engine — dispatches by file type
// ---------------------------------------------------------------------------

import type {
  ComparisonFile,
  ComparisonResult,
} from "@/lib/types";
import { computeTextDiff } from "@/lib/comparison/text";
import { computeImageDiff } from "@/lib/comparison/image";

/** Compare two files and return a typed result */
export async function compare(
  original: ComparisonFile,
  modified: ComparisonFile
): Promise<ComparisonResult> {
  // Both must be the same type for meaningful comparison
  if (original.type !== modified.type) {
    return {
      type: "incompatible",
      reason: `Cannot compare ${original.type} file with ${modified.type} file.`,
    };
  }

  switch (original.type) {
    case "text":
      return {
        type: "text",
        lines: computeTextDiff(
          original.textContent ?? "",
          modified.textContent ?? ""
        ),
      };

    case "image":
      if (!original.dataUrl || !modified.dataUrl) {
        return {
          type: "incompatible",
          reason: "Image data not available for comparison.",
        };
      }
      return {
        type: "image",
        diff: await computeImageDiff(
          {
            name: original.name,
            size: original.size,
            type: original.mimeType,
            dataUrl: original.dataUrl,
          },
          {
            name: modified.name,
            size: modified.size,
            type: modified.mimeType,
            dataUrl: modified.dataUrl,
          }
        ),
      };

    default:
      return {
        type: "incompatible",
        reason: `Unsupported file type: ${original.type}`,
      };
  }
}
