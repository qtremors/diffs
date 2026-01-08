"use client";
import { useState, useRef, useMemo, useSyncExternalStore } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  WrapText,
  Check,
  Copy,
  LoaderCircle,
} from "lucide-react";
import type { TextComparisonResult, TextDiffLine, TextLine } from "@/lib/types";
import { useTextComparison } from "@/hooks/useTextComparison";
import { useTextActions } from "@/hooks/useTextActions";

interface Props {
  oldText: string;
  newText: string;
  originalName?: string;
  modifiedName?: string;
  result?: TextComparisonResult;
  allowPatch?: boolean;
}
type DisplayRow =
  | { kind: "line"; index: number; line: TextDiffLine }
  | { kind: "gap"; index: number; count: number };
const ROW_HEIGHT = 26;
const subscribeToWidth = (notify: () => void) => {
  const query = window.matchMedia("(max-width: 600px)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const narrowSnapshot = () => window.matchMedia("(max-width: 600px)").matches;
const serverSnapshot = () => false;
function indexAt(offsets: number[], value: number) {
  let low = 0;
  let high = offsets.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high + 1) / 2);
    if (offsets[middle] <= value) low = middle;
    else high = middle - 1;
  }
  return low;
}

export default function TextDiffViewer({
  oldText,
  newText,
  originalName = "Original",
  modifiedName = "Modified",
  result: initial,
  allowPatch = true,
}: Props) {
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [viewMode, setViewMode] = useState<"auto" | "split" | "unified">(
    "auto",
  );
  const narrow = useSyncExternalStore(
    subscribeToWidth,
    narrowSnapshot,
    serverSnapshot,
  );
  const unified = viewMode === "unified" || (viewMode === "auto" && narrow);
  const [activeChange, setActiveChange] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const { message, exporting, exportPatch, copy } = useTextActions(
    oldText,
    newText,
    originalName,
    modifiedName,
  );
  const scroll = useRef<HTMLDivElement>(null);
  const computed = useTextComparison(
    oldText,
    newText,
    ignoreWhitespace,
    !initial || ignoreWhitespace,
  );
  const result = initial && !ignoreWhitespace ? initial : computed.result;
  const lines = result?.lines;
  const changes = useMemo(
    () =>
      lines?.flatMap((line, i) =>
        line.type !== "unchanged" &&
        (i === 0 || lines[i - 1].type === "unchanged")
          ? [i]
          : [],
      ) ?? [],
    [lines],
  );
  const selected = Math.min(activeChange, Math.max(0, changes.length - 1));
  const display = useMemo<DisplayRow[]>(() => {
    if (!lines) return [];
    if (!onlyChanges)
      return lines.map((line, index) => ({ kind: "line", index, line }));
    const visible = new Set<number>();
    lines.forEach((line, index) => {
      if (line.type !== "unchanged")
        for (
          let i = Math.max(0, index - 3);
          i <= Math.min(lines.length - 1, index + 3);
          i++
        )
          visible.add(i);
    });
    const rows: DisplayRow[] = [];
    let hidden = 0;
    lines.forEach((line, index) => {
      if (!visible.has(index)) {
        hidden++;
        return;
      }
      if (hidden) {
        rows.push({ kind: "gap", index: index - hidden, count: hidden });
        hidden = 0;
      }
      rows.push({ kind: "line", index, line });
    });
    if (hidden)
      rows.push({ kind: "gap", index: lines.length - hidden, count: hidden });
    return rows;
  }, [lines, onlyChanges]);
  const canWrap = display.length <= 800;
  const wrapped = wrap && canWrap;
  const virtual = display.length > 800 && !wrapped;
  const offsets = useMemo(() => {
    const values = [0];
    for (const row of display) {
      const count =
        row.kind === "line" && unified && row.line.type !== "unchanged"
          ? Number(!!row.line.left) + Number(!!row.line.right)
          : 1;
      values.push(values[values.length - 1] + count * ROW_HEIGHT);
    }
    return values;
  }, [display, unified]);
  const start = virtual
    ? Math.max(
        0,
        Math.min(display.length - 1, indexAt(offsets, scrollTop) - 10),
      )
    : 0;
  const end = virtual
    ? Math.min(display.length, indexAt(offsets, scrollTop + 1000) + 10)
    : display.length;

  const navigate = (direction: number) => {
    if (!changes.length) return;
    const next = (selected + direction + changes.length) % changes.length;
    setActiveChange(next);
    const target = display.findIndex(
      (row) => row.kind === "line" && row.index === changes[next],
    );
    if (virtual)
      scroll.current?.scrollTo({ top: offsets[target], behavior: "instant" });
    else
      scroll.current
        ?.querySelector(`[data-row="${changes[next]}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="text-diff-viewer">
      <div className="result-toolbar">
        <div className="result-summary" role="status">
          {computed.pending ? (
            <>
              <LoaderCircle size={15} className="spin" />
              Comparing…
            </>
          ) : computed.error ? (
            "Could not compare"
          ) : result?.equivalent ? (
            <>
              <Check size={15} />
              {result.identical
                ? "Text matches"
                : "Matches with whitespace ignored"}
            </>
          ) : (
            <>
              <span className="change-count diff-added">
                +{result?.added ?? 0}
              </span>
              <span className="change-count diff-removed">
                −{result?.removed ?? 0}
              </span>
              <span className="muted">lines</span>
            </>
          )}
        </div>
        <div className="result-actions">
          <div className="change-navigation">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous change"
              disabled={!changes.length}
              onClick={() => navigate(-1)}
            >
              <ArrowUp size={15} />
            </button>
            <span>
              {changes.length
                ? `${selected + 1} / ${changes.length}`
                : "0 changes"}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next change"
              disabled={!changes.length}
              onClick={() => navigate(1)}
            >
              <ArrowDown size={15} />
            </button>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={copy}
            title="Copy modified text"
            aria-label="Copy modified text"
          >
            <Copy size={14} />
            <span className="optional-label">Copy</span>
          </button>
          {allowPatch && (
            <button
              type="button"
              className="btn-secondary"
              onClick={exportPatch}
              disabled={exporting || !result || computed.pending}
              title="Download an exact patch, including ignored whitespace"
            >
              <Download size={14} />
              {exporting ? "Exporting…" : "Patch"}
            </button>
          )}
        </div>
      </div>
      <div className="diff-options">
        <div className="view-toggle" aria-label="Text layout">
          <button
            type="button"
            aria-pressed={!unified}
            onClick={() => {
              setViewMode("split");
              setScrollTop(0);
              scroll.current?.scrollTo({ top: 0 });
            }}
          >
            Split
          </button>
          <button
            type="button"
            aria-pressed={unified}
            onClick={() => {
              setViewMode("unified");
              setScrollTop(0);
              scroll.current?.scrollTo({ top: 0 });
            }}
          >
            Unified
          </button>
        </div>
        <label className="check-control">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(event) => {
              setIgnoreWhitespace(event.target.checked);
              setActiveChange(0);
              setScrollTop(0);
              scroll.current?.scrollTo({ top: 0 });
            }}
          />
          Ignore whitespace
        </label>
        <label className="check-control">
          <input
            type="checkbox"
            checked={onlyChanges}
            onChange={(event) => {
              setOnlyChanges(event.target.checked);
              setScrollTop(0);
              scroll.current?.scrollTo({ top: 0 });
            }}
          />
          Changes only
        </label>
        <button
          type="button"
          className={`btn-ghost wrap-button ${wrapped ? "is-active" : ""}`}
          onClick={() => setWrap(!wrapped)}
          aria-pressed={wrapped}
          disabled={!canWrap}
          title={
            canWrap ? "Wrap long lines" : "Use a smaller view to wrap lines"
          }
        >
          <WrapText size={14} />
          Wrap
        </button>
      </div>
      {computed.error ? (
        <div className="inline-error" role="alert">
          {computed.error}
        </div>
      ) : !result ? (
        <div className="result-loading">
          <LoaderCircle className="spin" size={20} />
          <span>Finding the changes…</span>
        </div>
      ) : (
        <>
          {result.simplified && (
            <p className="result-note">
              Large changes are highlighted by line to keep the comparison
              responsive.
            </p>
          )}
          <div className={`diff-container ${unified ? "diff-unified" : ""}`}>
            {unified ? (
              <div className="diff-column-headings unified-heading">
                <div>
                  <strong title={`${originalName} → ${modifiedName}`}>
                    {originalName} → {modifiedName}
                  </strong>
                  <span>− Original / + Modified</span>
                </div>
              </div>
            ) : (
              <div className="diff-column-headings">
                <div>
                  <span>01</span>
                  <strong title={originalName}>{originalName}</strong>
                  <span>Original</span>
                </div>
                <div>
                  <span>02</span>
                  <strong title={modifiedName}>{modifiedName}</strong>
                  <span>Modified</span>
                </div>
              </div>
            )}
            <div
              className={`diff-scroll ${wrapped ? "diff-wrap" : ""}`}
              ref={scroll}
              onScroll={(event) => {
                if (virtual) setScrollTop(event.currentTarget.scrollTop);
              }}
              tabIndex={0}
              aria-label="Text comparison. Minus marks original lines; plus marks modified lines."
            >
              <div className="diff-rows">
                {virtual && start > 0 && (
                  <div style={{ height: offsets[start] }} />
                )}
                {display.slice(start, end).map((row) =>
                  row.kind === "gap" ? (
                    <div className="diff-gap" key={`gap-${row.index}`}>
                      {row.count.toLocaleString()} unchanged lines
                    </div>
                  ) : (
                    <div
                      className={`diff-row ${row.line.type !== "unchanged" && row.index === changes[selected] ? "diff-row-current" : ""}`}
                      data-row={row.index}
                      key={row.index}
                    >
                      {(!unified || row.line.left) && (
                        <TextCell
                          line={row.line.left}
                          opposite={row.line.right}
                          changed={row.line.type !== "unchanged"}
                          side="left"
                        />
                      )}
                      {(!unified ||
                        (row.line.right && row.line.type !== "unchanged")) && (
                        <TextCell
                          line={row.line.right}
                          opposite={row.line.left}
                          changed={row.line.type !== "unchanged"}
                          side="right"
                        />
                      )}
                    </div>
                  ),
                )}
                {virtual && end < display.length && (
                  <div
                    style={{ height: offsets[display.length] - offsets[end] }}
                  />
                )}
                {display.length === 0 && (
                  <div className="diff-empty">Both sides are empty.</div>
                )}
              </div>
            </div>
          </div>
          <div className="diff-legend">
            <span>− Original</span>
            <span>+ Modified</span>
            <span>{result.lines.length.toLocaleString()} aligned rows</span>
          </div>
        </>
      )}
      {message && (
        <p className="result-note" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function TextCell({
  line,
  opposite,
  changed,
  side,
}: {
  line: TextLine | null;
  opposite: TextLine | null;
  changed: boolean;
  side: "left" | "right";
}) {
  const showEnding = line && changed && line.ending !== opposite?.ending;
  return (
    <div
      className={`diff-cell ${changed ? `cell-${side}` : ""} ${!line ? "cell-empty" : ""}`}
    >
      <span className="line-number" aria-hidden="true">
        {line?.number}
      </span>
      <span className="line-sign" aria-hidden="true">
        {changed && line ? (side === "left" ? "−" : "+") : ""}
      </span>
      <span className="line-content">
        {line?.spans
          ? line.spans.map((span, i) => (
              <span
                className={span.changed ? "char-change" : undefined}
                key={i}
              >
                {span.value}
              </span>
            ))
          : line?.text || " "}
        {showEnding && (
          <span className="ending-label">
            {line.ending === "\r\n"
              ? "CRLF ↵"
              : line.ending === "\r"
                ? "CR ↵"
                : line.ending === "\n"
                  ? "LF ↵"
                  : "No newline"}
          </span>
        )}
      </span>
    </div>
  );
}
