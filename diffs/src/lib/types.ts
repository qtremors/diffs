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

export type WorkerTask = {kind:"text";oldText:string;newText:string;options:TextOptions} | {kind:"patch";oldText:string;newText:string;originalName:string;modifiedName:string} | {kind:"json";oldText:string;newText:string};
export interface WorkerResultMap { text:TextComparisonResult;patch:string;json:JsonComparisonResult; }
export type WorkerResult<T extends WorkerTask> = WorkerResultMap[T["kind"]];
