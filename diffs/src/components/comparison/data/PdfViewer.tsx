"use client";
import { useState } from "react";
import type { PdfComparisonResult } from "@/lib/types";
import TextDiffViewer from "../text/TextDiffViewer";
import { Counts, ReportButton } from "./shared";
export default function PdfViewer({ result }: { result: PdfComparisonResult }) {
  const [original, setOriginal] = useState(0);
  const [modified, setModified] = useState(0);
  const [linked, setLinked] = useState(true);
  const max = result.pageStates.length;
  const change = (value: number, side: "original" | "modified") => {
    if (linked) {
      setOriginal(value);
      setModified(value);
    } else if (side === "original") setOriginal(value);
    else setModified(value);
  };
  const nextChange = () => {
    const next = result.pageStates.findIndex(
      (state, i) => i > original && state !== "same",
    );
    const fallback = result.pageStates.findIndex((state) => state !== "same");
    const page = next < 0 ? fallback : next;
    if (page >= 0) {
      setOriginal(page);
      setModified(page);
    }
  };
  return (
    <div className="data-view">
      <div className="data-heading">
        <div>
          <h3>
            {!result.hasOriginalText || !result.hasModifiedText
              ? "PDF text extraction is incomplete"
              : result.equivalent
                ? "Extracted PDF text matches"
                : "PDF page text changed"}
          </h3>
          <Counts {...result} />
        </div>
        <ReportButton data={result} name="pdf-text-comparison" />
      </div>
      <p className="data-note">
        Compares extracted text by page position. Layout, fonts, embedded
        images, and scanned text are excluded. Use Bytes for exact file
        differences.
      </p>
      {(!result.hasOriginalText || !result.hasModifiedText) && (
        <p className="data-notice" role="status">
          {!result.hasOriginalText && "Original PDF has no selectable text. "}
          {!result.hasModifiedText && "Modified PDF has no selectable text. "}
          Scans need OCR before their text can be compared. Blank extracted
          pages do not establish that PDFs match.
        </p>
      )}
      <div className="data-settings">
        {(["original", "modified"] as const).map((side) => (
          <label className="field-label" key={side}>
            {side === "original" ? "Original page" : "Modified page"}
            <select
              aria-label={
                side === "original" ? "Original page" : "Modified page"
              }
              value={side === "original" ? original : modified}
              onChange={(e) => change(Number(e.target.value), side)}
            >
              {Array.from({ length: max }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}
                  {i >=
                  (side === "original"
                    ? result.originalPages.length
                    : result.modifiedPages.length)
                    ? " · absent"
                    : ""}
                  {linked ? ` · ${result.pageStates[i]}` : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="check-control">
          <input
            type="checkbox"
            checked={linked}
            onChange={(e) => {
              setLinked(e.target.checked);
              if (e.target.checked) setModified(original);
            }}
          />
          Link page selection
        </label>
        <button
          type="button"
          className="btn-secondary"
          onClick={nextChange}
          disabled={result.equivalent}
        >
          Next changed page
        </button>
      </div>
      <TextDiffViewer
        key={`${original}-${modified}`}
        oldText={result.originalPages[original] ?? ""}
        newText={result.modifiedPages[modified] ?? ""}
        originalName={`Original · page ${original + 1}`}
        modifiedName={`Modified · page ${modified + 1}`}
        allowPatch={false}
      />
    </div>
  );
}
