"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Braces,
  ChevronDown,
  ChevronUp,
  Files,
  FolderUp,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Type,
  X,
} from "lucide-react";
import FileWorkspace from "@/components/comparison/FileWorkspace";
import ComparisonView from "@/components/comparison/ComparisonView";
import PastedWorkspace from "@/components/comparison/text/PastedWorkspace";
import Tabs from "@/components/ui/Tabs";
import Footer from "@/components/layout/Footer";
import { useComparison } from "@/hooks/useComparison";

const oldExample =
  '{\n  "name": "a little better",\n  "version": "1.0",\n  "theme": "dark",\n  "features": ["text", "images"]\n}\n';
const newExample =
  '{\n  "name": "a little better",\n  "version": "1.1",\n  "theme": "black",\n  "features": ["text", "images", "exports"]\n}\n';

export default function Home() {
  const app = useComparison();
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const hasText = !!(app.oldText || app.newText);
  const hasResults = app.pairs.length > 0;
  const canCollapse = app.mode === "files" && hasResults;
  const inputsHidden = collapsed && canCollapse;
  const emptyMode = app.mode === "files" ? app.files.length === 0 : !hasText;
  const busy = app.isReading || app.isComparing;

  const example = async () => {
    if (app.mode === "text") {
      app.setText("oldText", oldExample);
      app.setText("newText", newExample);
    } else {
      await app.addSelectedFiles([
        new File([oldExample], "original.json", { type: "application/json" }),
        new File([newExample], "modified.json", { type: "application/json" }),
      ]);
      app.runComparison();
    }
  };

  return (
    <div
      className="app-shell"
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current++;
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (!app.ready || app.isReading) return;
        app.setMode("files");
        setCollapsed(false);
        if (
          Array.from(event.dataTransfer.items).some(
            (item) => item.webkitGetAsEntry?.()?.isDirectory,
          )
        ) {
          app.reportError("Use Add folder to select each folder snapshot.");
        } else void app.addSelectedFiles(event.dataTransfer.files);
      }}
    >
      <a className="skip-link" href="#workspace">
        Skip to comparison
      </a>
      <header className="app-header">
        <Link className="brand" href="/" aria-label="Diffs home">
          <span className="brand-mark" aria-hidden="true">
            <Braces size={26} strokeWidth={1.8} />
            <span />
          </span>
          <span>
            diffs<span className="brand-period">.</span>
          </span>
        </Link>
        <Tabs
          tabs={[
            { id: "files", label: "Files", icon: <Files size={15} /> },
            { id: "text", label: "Text", icon: <Type size={15} /> },
          ]}
          activeId={app.mode}
          onChange={(mode) => {
            app.setMode(mode as "files" | "text");
            setCollapsed(false);
          }}
          label="Input mode"
          id="input-mode"
          panelId="input-panel"
          disabled={!app.ready}
        />
        <div className="header-actions">
          <span className="local-label">
            <span className="status-dot" />
            On your device
          </span>
          <button
            type="button"
            className="btn-ghost reset-button"
            aria-label="Reset"
            onClick={() => {
              app.reset();
              setCollapsed(false);
            }}
            disabled={!app.ready || (!app.files.length && !hasText && !busy)}
            title="Reset workspace and clear this tab’s saved session"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      <main id="workspace" tabIndex={-1} className="app-main">
        {!emptyMode && (
          <h1 className="visually-hidden">
            Compare {app.mode === "files" ? "your files" : "your text"}
          </h1>
        )}
        {emptyMode && (
          <section className="intro">
            <div className="eyebrow">LOCAL FILE COMPARISON</div>
            <h1>
              See what changed<span>.</span>
            </h1>
            <p>Compare documents, data, images, and folders on your device.</p>
          </section>
        )}
        {app.errors.length > 0 && (
          <div className="error-banner" role="alert">
            <div>
              <strong>Check these details.</strong>
              <ul>
                {app.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Dismiss message"
              onClick={app.dismissErrors}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!app.ready ? (
          <div className="result-loading" role="status">
            <LoaderCircle className="spin" size={20} />
            <span>Opening your workspace…</span>
          </div>
        ) : (
          <div
            id="input-panel"
            role="tabpanel"
            aria-labelledby={`input-mode-${app.mode}`}
          >
            <section className="source-section" aria-labelledby="source-title">
              <div className="section-heading">
                <div className="section-title">
                  <span className="section-number">01</span>
                  <h2 id="source-title">
                    {app.mode === "files" ? "Your files" : "Your text"}
                  </h2>
                  {app.mode === "files" && app.files.length > 0 && (
                    <span className="count-pill">{app.files.length}</span>
                  )}
                </div>
                <div className="section-actions">
                  {emptyMode && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        void example();
                      }}
                      disabled={busy}
                    >
                      Try an example
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {app.mode === "text" && hasText && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={app.swapText}
                    >
                      <ArrowLeftRight size={14} />
                      Swap
                    </button>
                  )}
                  {inputsHidden && app.isComparing && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={app.cancel}
                    >
                      Cancel
                    </button>
                  )}
                  {canCollapse && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setCollapsed(!collapsed)}
                      aria-expanded={!inputsHidden}
                      aria-controls="source-inputs"
                    >
                      {inputsHidden ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronUp size={14} />
                      )}
                      {inputsHidden ? "Show inputs" : "Hide inputs"}
                    </button>
                  )}
                </div>
              </div>
              {inputsHidden ? (
                <button
                  type="button"
                  className="collapsed-summary"
                  onClick={() => setCollapsed(false)}
                >
                  {app.mode === "files" ? (
                    <span>
                      {app.files.length} files · Original:{" "}
                      <strong>
                        {
                          app.files.find((file) => file.id === app.originalId)
                            ?.name
                        }
                      </strong>
                    </span>
                  ) : (
                    <span>Original and modified text</span>
                  )}
                  <ChevronDown size={14} />
                </button>
              ) : (
                <div id="source-inputs">
                  {app.mode === "files" ? (
                    <FileWorkspace app={app} />
                  ) : (
                    <PastedWorkspace
                      oldText={app.oldText}
                      newText={app.newText}
                      format={app.pasteFormat}
                      onFormat={app.setPasteFormat}
                      onOldTextChange={(text) => app.setText("oldText", text)}
                      onNewTextChange={(text) => app.setText("newText", text)}
                    />
                  )}
                </div>
              )}
              {app.isReading && (
                <p className="reading-status" role="status">
                  <LoaderCircle className="spin" size={14} />
                  {app.readingLabel || "Opening your files…"}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={app.cancelReading}
                  >
                    Cancel opening
                  </button>
                </p>
              )}
            </section>
            {app.mode === "files" && hasResults && (
              <section
                className="results-section"
                aria-labelledby="review-title"
              >
                <div className="section-heading review-heading">
                  <div className="section-title">
                    <span className="section-number">02</span>
                    <h2 id="review-title">The comparison</h2>
                  </div>
                </div>
                <ComparisonView
                  pairs={app.pairs}
                  activeId={app.activeId}
                  busy={app.isComparing}
                  onSelect={(id, options) => {
                    void app.selectCandidate(id, options);
                  }}
                  onRetry={() => {
                    void app.selectCandidate(app.activeId);
                  }}
                />
              </section>
            )}
            {emptyMode && app.mode === "files" && (
              <div className="format-guide">
                <div>
                  <Type size={17} />
                  <span>
                    <strong>Text & code</strong>
                    <small>Line, JSON field, and CSV/TSV record views</small>
                  </span>
                </div>
                <div>
                  <FolderUp size={17} />
                  <span>
                    <strong>Images & PDFs</strong>
                    <small>Pixel differences and extracted PDF text</small>
                  </span>
                </div>
                <div>
                  <ShieldCheck size={17} />
                  <span>
                    <strong>Any file & folders</strong>
                    <small>Raw bytes and SHA-256 · no uploads</small>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <div className="session-bar">
        <div className="session-status">
          <ShieldCheck size={14} />
          <span>
            {app.remember
              ? app.storageStatus
              : "Temporary session. Nothing is uploaded."}
          </span>
        </div>
        <label className="check-control">
          <input
            type="checkbox"
            aria-label="Remember this tab"
            aria-describedby="retention-help"
            checked={app.remember}
            disabled={!app.ready}
            onChange={(event) => app.setRemember(event.target.checked)}
          />
          Remember this tab
          <span
            className="info-label"
            title="Saves files and text in this browser for reloads. Turn off or Reset to delete this tab’s saved copy."
            aria-label="Save files and text for reloads. Turn off or Reset to delete the saved copy."
          >
            <span aria-hidden="true">?</span>
          </span>
        </label>
      </div>
      <p id="retention-help" className="visually-hidden">
        Save files and text in this browser for reloads. Turn off or Reset to
        delete this tab’s saved copy.
      </p>
      <Footer />
      {dragging && (
        <div className="drop-overlay" aria-live="polite">
          <FolderUp size={36} strokeWidth={1.3} />
          <strong>Drop to add files</strong>
          <span>They stay on your device.</span>
        </div>
      )}
    </div>
  );
}
