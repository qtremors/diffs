"use client";

// ---------------------------------------------------------------------------
// TextDiffViewer — side-by-side text diff with char-level highlighting
// ---------------------------------------------------------------------------

import React, { useMemo } from "react";
import type { TextDiffLine } from "@/lib/types";
import { computeTextDiff, computeCharDiff } from "@/lib/comparison/text";
import { useScrollSync } from "@/hooks/useScrollSync";

interface TextDiffViewerProps {
  oldText: string;
  newText: string;
  originalName?: string;
  modifiedName?: string;
}

export default function TextDiffViewer({ oldText, newText, originalName, modifiedName }: TextDiffViewerProps) {
  const { leftRef, rightRef, handleScroll } = useScrollSync();

  const diffData = useMemo(
    () => computeTextDiff(oldText, newText),
    [oldText, newText]
  );

  return (
    <div className="diff-container">
      <div className="diff-panels">
        {/* Left — Original */}
        <div
          ref={leftRef}
          onScroll={handleScroll}
          className="diff-panel diff-scroll-sync"
        >
          <div className="diff-header">{originalName || "Original"}</div>
          <div className="diff-body">
            {renderSide(diffData, "left")}
          </div>
        </div>

        {/* Right — Modified */}
        <div
          ref={rightRef}
          onScroll={handleScroll}
          className="diff-panel diff-scroll-sync"
        >
          <div className="diff-header">{modifiedName || "Modified"}</div>
          <div className="diff-body">
            {renderSide(diffData, "right")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function renderSide(diffData: TextDiffLine[], side: "left" | "right") {
  let lineNumber = 1;

  return diffData.map((item, index) => {
    let content: React.ReactNode = null;
    let className = "diff-line";
    let displayLineNumber: string | number = "";

    if (item.type === "modification") {
      const line = side === "left" ? item.oldLine : item.newLine;
      if (line !== null && line !== undefined) {
        content = renderCharDiff(item.oldLine ?? "", item.newLine ?? "", side);
        className += side === "left" ? " line-removed" : " line-added";
        displayLineNumber = lineNumber++;
      } else {
        className += " line-empty";
      }
    } else if (item.type === "added") {
      if (side === "right") {
        content = item.line;
        className += " line-added-full";
        displayLineNumber = lineNumber++;
      } else {
        className += " line-empty";
      }
    } else if (item.type === "removed") {
      if (side === "left") {
        content = item.line;
        className += " line-removed-full";
        displayLineNumber = lineNumber++;
      } else {
        className += " line-empty";
      }
    } else {
      content = item.line;
      displayLineNumber = lineNumber++;
    }

    return (
      <div key={index} className={className}>
        <div className="diff-line-number">{displayLineNumber}</div>
        <div className="diff-line-content">{content || " "}</div>
      </div>
    );
  });
}

function renderCharDiff(oldLine: string, newLine: string, side: "left" | "right") {
  const charDiff = computeCharDiff(oldLine, newLine);
  return charDiff.map((part, index) => {
    if (side === "left" && part.added) return null;
    if (side === "right" && part.removed) return null;

    const className = part.added ? "char-added" : part.removed ? "char-removed" : "";
    return (
      <span key={index} className={className}>
        {part.value}
      </span>
    );
  });
}
