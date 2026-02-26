// ---------------------------------------------------------------------------
// Core type definitions for the Diffs comparison platform
// ---------------------------------------------------------------------------

/** Supported file types for comparison */
export type FileType = "text" | "image" | "unknown";

/** A file that has been loaded into the comparison system */
export interface ComparisonFile {
  id: string;
  name: string;
  type: FileType;
  /** Raw file size in bytes */
  size: number;
  /** Text content (for text files) */
  textContent?: string;
  /** Data URL string (for images) */
  dataUrl?: string;
  /** MIME type of the original file */
  mimeType: string;
}

// ---------------------------------------------------------------------------
// Text comparison types
// ---------------------------------------------------------------------------

export type TextDiffLineType =
  | "modification"
  | "added"
  | "removed"
  | "unchanged";

/** A single processed diff line ready for rendering */
export interface TextDiffLine {
  type: TextDiffLineType;
  /** Present for 'added', 'removed', 'unchanged' */
  line?: string;
  /** Present for 'modification' — old side */
  oldLine?: string | null;
  /** Present for 'modification' — new side */
  newLine?: string | null;
}

// ---------------------------------------------------------------------------
// Image comparison types
// ---------------------------------------------------------------------------

export interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  format: string;
  aspectRatio: string;
}

export interface ImageDiffResult {
  original: ImageMetadata;
  modified: ImageMetadata;
  /** Data URL of the pixel diff canvas output */
  diffDataUrl: string;
  /** Number of differing pixels */
  diffPixelCount: number;
  /** Percentage of pixels that differ (0–100) */
  diffPercentage: number;
  /** Total pixels compared */
  totalPixels: number;
}

// ---------------------------------------------------------------------------
// Comparison result — union type returned by the engine
// ---------------------------------------------------------------------------

export interface TextComparisonResult {
  type: "text";
  lines: TextDiffLine[];
}

export interface ImageComparisonResult {
  type: "image";
  diff: ImageDiffResult;
}

export interface IncompatibleComparisonResult {
  type: "incompatible";
  reason: string;
}

export type ComparisonResult =
  | TextComparisonResult
  | ImageComparisonResult
  | IncompatibleComparisonResult;

/** A comparison pair: original file vs one modified file */
export interface ComparisonPair {
  original: ComparisonFile;
  modified: ComparisonFile;
  result: ComparisonResult | null;
}
