export type FileType =
  | "text"
  | "image"
  | "json"
  | "table"
  | "pdf"
  | "binary"
  | "folder";

export interface ComparisonFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  mimeType: string;
  textContent?: string;
  dataUrl?: string;
  bytes?: Uint8Array;
  hash?: string;
  pages?: string[];
  entries?: FolderEntry[];
}

export interface TextOptions {
  ignoreWhitespace: boolean;
}

export interface TextLine {
  text: string;
  ending: string;
  number: number;
  spans?: { value: string; changed: boolean }[];
}

export interface TextDiffLine {
  type: "changed" | "added" | "removed" | "unchanged";
  left: TextLine | null;
  right: TextLine | null;
}

export interface TextComparisonResult {
  type: "text";
  lines: TextDiffLine[];
  added: number;
  removed: number;
  identical: boolean;
  equivalent: boolean;
  normalized: boolean;
  simplified: boolean;
}

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
  diffDataUrl: string;
  originalDataUrl: string;
  modifiedDataUrl: string;
  width: number;
  height: number;
  diffPixelCount: number;
  diffPercentage: number;
  totalPixels: number;
  threshold: number;
  dimensionsMatch: boolean;
}

export type ComparisonResult =
  | JsonComparisonResult
  | TableComparisonResult
  | BinaryComparisonResult
  | FolderComparisonResult
  | PdfComparisonResult
  | TextComparisonResult
  | { type: "image"; diff: ImageDiffResult }
  | { type: "error"; reason: string };
export interface ComparisonPair {
  original: ComparisonFile;
  modified: ComparisonFile;
  result: ComparisonResult | null;
  options?: ComparisonOptions;
  resultOptions?: ComparisonOptions;
}

export interface SessionData {
  files: ComparisonFile[];
  originalId: string | null;
  oldText: string;
  newText: string;
  mode: "files" | "text";
  pasteFormat?: "text" | "json" | "table";
}

export type WorkerTask =
  | { kind: "json"; oldText: string; newText: string }
  | {
      kind: "table";
      oldText: string;
      newText: string;
      options: TableOptions;
      originalName?: string;
      modifiedName?: string;
    }
  | { kind: "bytes"; original: Uint8Array; modified: Uint8Array }
  | { kind: "folder"; original: FolderEntry[]; modified: FolderEntry[] }
  | { kind: "pdf"; original: string[]; modified: string[] }
  | { kind: "text"; oldText: string; newText: string; options: TextOptions }
  | {
      kind: "image";
      original: ComparisonFile;
      modified: ComparisonFile;
      threshold: number;
    }
  | {
      kind: "patch";
      oldText: string;
      newText: string;
      originalName: string;
      modifiedName: string;
    };

export type CompareMode =
  | "auto"
  | "text"
  | "json"
  | "table"
  | "pdf"
  | "bytes"
  | "folder";
export interface TableOptions {
  delimiter: "auto" | "," | "\t" | ";" | "|";
  headers: boolean;
  keyColumn: string | null;
}
export interface ComparisonOptions {
  mode?: CompareMode;
  imageThreshold?: number;
  table?: TableOptions;
}
export type ChangeKind = "added" | "removed" | "changed" | "same";
export interface JsonValue {
  kind: string;
  raw: string;
}
export interface JsonChange {
  path: string;
  kind: Exclude<ChangeKind, "same">;
  before: JsonValue | null;
  after: JsonValue | null;
}
export interface JsonComparisonResult {
  type: "json";
  changes: JsonChange[];
  identical: boolean;
  equivalent: boolean;
  added: number;
  removed: number;
  changed: number;
}
export interface TableRow {
  key: string;
  kind: ChangeKind;
  originalRow: number | null;
  modifiedRow: number | null;
  before: Record<string, string> | null;
  after: Record<string, string> | null;
  changedColumns: string[];
}
export interface TableComparisonResult {
  type: "table";
  columns: string[];
  originalColumns: string[];
  modifiedColumns: string[];
  rows: TableRow[];
  added: number;
  removed: number;
  changed: number;
  same: number;
  equivalent: boolean;
  originalDelimiter: string;
  modifiedDelimiter: string;
  options: TableOptions;
}
export interface BinaryComparisonResult {
  type: "binary";
  identical: boolean;
  differentBytes: number;
  originalHash: string;
  modifiedHash: string;
  originalSize: number;
  modifiedSize: number;
  ranges: { start: number; end: number }[];
  rangeCount: number;
}
export interface FolderEntry {
  path: string;
  size: number;
  hash: string;
}
export interface FolderChange {
  path: string;
  kind: ChangeKind;
  before: FolderEntry | null;
  after: FolderEntry | null;
}
export interface FolderComparisonResult {
  type: "folder";
  entries: FolderChange[];
  added: number;
  removed: number;
  changed: number;
  same: number;
  equivalent: boolean;
}
export interface PdfComparisonResult {
  type: "pdf";
  originalPages: string[];
  modifiedPages: string[];
  pageStates: ChangeKind[];
  changed: number;
  added: number;
  removed: number;
  same: number;
  equivalent: boolean;
  hasOriginalText: boolean;
  hasModifiedText: boolean;
}

/** A task's kind fixes its reply type; callers cannot choose an unrelated result. */
export interface WorkerResultMap {
  text: TextComparisonResult;
  image: { type: "image"; diff: ImageDiffResult };
  patch: string;
  json: JsonComparisonResult;
  table: TableComparisonResult;
  bytes: BinaryComparisonResult;
  folder: FolderComparisonResult;
  pdf: PdfComparisonResult;
}
export type WorkerResult<T extends WorkerTask> = WorkerResultMap[T["kind"]];
