"use client";
import { LoaderCircle, ArrowRight, CircleAlert } from "lucide-react";
import type {
  ComparisonPair,
  ComparisonOptions,
  CompareMode,
  ComparisonResult,
} from "@/lib/types";
import { automaticMode } from "@/lib/comparison/engine";
import { DEFAULT_TABLE_OPTIONS } from "@/lib/constants";
import TextDiffViewer from "./text/TextDiffViewer";
import ImageDiffViewer from "./image/ImageDiffViewer";
import JsonViewer from "./data/JsonViewer";
import TableViewer, { TableSettings } from "./data/TableViewer";
import FolderViewer from "./data/FolderViewer";
import BinaryViewer from "./data/BinaryViewer";
import PdfViewer from "./data/PdfViewer";
function status(result: ComparisonResult | null) {
  if (!result) return "Ready";
  if (result.type === "error") return "Could not compare";
  if (result.type === "image")
    return result.diff.diffPercentage === 0 ? "Same pixels" : "Changed";
  if (result.type === "binary")
    return result.identical ? "Same bytes" : "Changed";
  if (
    result.type === "pdf" &&
    (!result.hasOriginalText || !result.hasModifiedText)
  )
    return "Check extracted text";
  return result.equivalent ? "Matches" : "Changed";
}
export default function ComparisonView({
  pairs,
  activeId,
  onSelect,
  busy,
  onRetry,
}: {
  pairs: ComparisonPair[];
  activeId: string;
  onSelect: (id: string, options?: ComparisonOptions) => void;
  busy: boolean;
  onRetry: () => void;
}) {
  const pair = pairs.find((item) => item.modified.id === activeId) ?? pairs[0];
  if (!pair) return null;
  const { original, modified, result } = pair;
  const options = pair.options ?? {};
  const mode =
    options.mode && options.mode !== "auto"
      ? options.mode
      : automaticMode(original, modified);
  const hasText =
    original.textContent !== undefined && modified.textContent !== undefined;
  const table = options.table ?? DEFAULT_TABLE_OPTIONS;
  const columns =
    result?.type === "table"
      ? result.originalColumns.filter((c) => result.modifiedColumns.includes(c))
      : [];
  return (
    <div className="comparison-view">
      {pairs.length > 1 && (
        <div className="candidate-list" aria-label="Compare against original">
          {pairs.map((item) => (
            <button
              type="button"
              className={`candidate ${activeId === item.modified.id ? "candidate-active" : ""}`}
              aria-pressed={activeId === item.modified.id}
              onClick={() => onSelect(item.modified.id)}
              key={item.modified.id}
            >
              <span title={item.modified.name}>{item.modified.name}</span>
              <small>
                {busy && activeId === item.modified.id
                  ? "Comparing…"
                  : status(item.result)}
              </small>
            </button>
          ))}
        </div>
      )}
      <div className="pair-heading">
        <span title={original.name}>{original.name}</span>
        <ArrowRight size={14} />
        <span title={modified.name}>{modified.name}</span>
      </div>
      <div className="comparison-format">
        <label className="field-label">
          Compare as
          <select
            aria-label="Compare as"
            value={options.mode ?? "auto"}
            disabled={busy}
            onChange={(e) =>
              onSelect(modified.id, { mode: e.target.value as CompareMode })
            }
          >
            <option value="auto">
              Automatic · {automaticMode(original, modified)}
            </option>
            {hasText && (
              <>
                <option value="text">Source text</option>
                <option value="json">JSON fields</option>
                <option value="table">Table records</option>
              </>
            )}
            {original.bytes && modified.bytes && (
              <option value="bytes">Bytes</option>
            )}
          </select>
        </label>
        {original.hash &&
          modified.hash &&
          original.type !== "folder" &&
          modified.type !== "folder" && (
            <span className="byte-proof">
              {original.hash === modified.hash
                ? "SHA-256 matches · identical file bytes"
                : "SHA-256 differs · file bytes changed"}
            </span>
          )}
      </div>
      {mode === "table" && (
        <TableSettings
          options={table}
          columns={columns}
          disabled={busy}
          onChange={(table) => onSelect(modified.id, { table })}
        />
      )}
      {result?.type === "text" ? (
        <TextDiffViewer
          key={modified.id}
          oldText={original.textContent ?? ""}
          newText={modified.textContent ?? ""}
          originalName={original.name}
          modifiedName={modified.name}
          result={result}
        />
      ) : result?.type === "image" ? (
        <ImageDiffViewer
          key={modified.id}
          diff={result.diff}
          originalName={original.name}
          modifiedName={modified.name}
          busy={busy}
          onThresholdChange={(imageThreshold) =>
            onSelect(modified.id, { imageThreshold })
          }
        />
      ) : result?.type === "json" ? (
        <JsonViewer key={modified.id} result={result} />
      ) : result?.type === "table" ? (
        <TableViewer key={modified.id} result={result} />
      ) : result?.type === "folder" ? (
        <FolderViewer key={modified.id} result={result} />
      ) : result?.type === "binary" ? (
        <BinaryViewer
          key={modified.id}
          result={result}
          original={original}
          modified={modified}
        />
      ) : result?.type === "pdf" ? (
        <PdfViewer key={modified.id} result={result} />
      ) : result?.type === "error" ? (
        <div className="comparison-error" role="alert">
          <CircleAlert size={24} />
          <h3>We couldn’t compare this pair</h3>
          <p>{result.reason}</p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : (
        <div className="result-loading" role="status">
          {busy ? (
            <>
              <LoaderCircle size={22} className="spin" />
              <span>Finding the differences…</span>
            </>
          ) : (
            <>
              <span>Comparison paused.</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onSelect(modified.id)}
              >
                Continue
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
