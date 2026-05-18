"use client";
import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  LoaderCircle,
  WrapText,
} from "lucide-react";
import { useTextComparison } from "@/hooks/useTextComparison";
import { useTextActions } from "@/hooks/useTextActions";
import TextMergeEditor, { type TextMergeEditorHandle } from "./TextMergeEditor";
export default function TextInputPanel({
  oldText,
  newText,
  onOldTextChange,
  onNewTextChange,
}: {
  oldText: string;
  newText: string;
  onOldTextChange: (text: string) => void;
  onNewTextChange: (text: string) => void;
}) {
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [limit, setLimit] = useState("");
  const editor = useRef<TextMergeEditorHandle>(null);
  const computed = useTextComparison(oldText, newText, ignoreWhitespace);
  const actions = useTextActions(oldText, newText);
  const result = computed.result;
  return (
    <div className="pasted-text-workspace">
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
          <button
            type="button"
            className="icon-button"
            aria-label="Previous change"
            disabled={!result || result.equivalent}
            onClick={() => editor.current?.navigate(-1)}
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Next change"
            disabled={!result || result.equivalent}
            onClick={() => editor.current?.navigate(1)}
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={actions.copy}
            aria-label="Copy modified text"
          >
            <Copy size={14} />
            <span className="optional-label">Copy</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={actions.exportPatch}
            disabled={actions.exporting || computed.pending || !result}
          >
            <Download size={14} />
            {actions.exporting ? "Exporting…" : "Patch"}
          </button>
        </div>
      </div>
      <div className="diff-options">
        <label className="check-control">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
          />
          Ignore whitespace
        </label>
        <label className="check-control">
          <input
            type="checkbox"
            checked={onlyChanges}
            onChange={(e) => setOnlyChanges(e.target.checked)}
          />
          Changes only
        </label>
        <button
          type="button"
          className={`btn-ghost wrap-button ${wrap ? "is-active" : ""}`}
          aria-pressed={wrap}
          onClick={() => setWrap(!wrap)}
        >
          <WrapText size={14} />
          Wrap
        </button>
        <span className="editor-hint">Paste or edit directly below.</span>
      </div>
      {(limit || computed.error) && (
        <p role="alert" className="inline-error">
          {limit || computed.error}
          {limit && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setLimit("")}
            >
              Dismiss
            </button>
          )}
        </p>
      )}
      <div className="editable-diff-frame">
        <div className="editable-headings">
          {["Original", "Modified"].map((label, i) => (
            <div key={label}>
              <span className={i === 0 ? "diff-removed" : "diff-added"}>
                {i === 0 ? "−" : "+"} {label}
              </span>
              <small>
                {(i === 0 ? oldText : newText).length.toLocaleString()}{" "}
                characters
              </small>
            </div>
          ))}
        </div>
        <TextMergeEditor
          ref={editor}
          oldText={oldText}
          newText={newText}
          onOldTextChange={onOldTextChange}
          onNewTextChange={onNewTextChange}
          ignoreWhitespace={ignoreWhitespace}
          wrap={wrap}
          onlyChanges={onlyChanges}
          onLimit={setLimit}
        />
      </div>
      {result?.simplified && (
        <p className="result-note">
          Large changes are highlighted by line to keep the comparison
          responsive.
        </p>
      )}
      <div className="diff-legend">
        <span className="diff-removed">− Removed from original</span>
        <span className="diff-added">+ Added in modified</span>
      </div>
      {actions.message && (
        <p role="status" className="result-note">
          {actions.message}
        </p>
      )}
    </div>
  );
}
