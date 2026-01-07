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
