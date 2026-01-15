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

export interface TableOptions {
  delimiter: "auto" | "," | "\t" | ";" | "|";
  headers: boolean;
  keyColumn: string | null;
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

export type WorkerTask = {kind:"text";oldText:string;newText:string;options:TextOptions} | {kind:"patch";oldText:string;newText:string;originalName:string;modifiedName:string} | {kind:"json";oldText:string;newText:string} | {kind:"table";oldText:string;newText:string;options:TableOptions;originalName?:string;modifiedName?:string};
export interface WorkerResultMap { text:TextComparisonResult;patch:string;json:JsonComparisonResult;table:TableComparisonResult; }
export type WorkerResult<T extends WorkerTask> = WorkerResultMap[T["kind"]];

export interface SessionData { pasteFormat?: "text" | "json" | "table"; }
export type ComparisonResult = TextComparisonResult | JsonComparisonResult | TableComparisonResult | {type:"error";reason:string};
