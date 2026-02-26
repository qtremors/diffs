"use client";

// ---------------------------------------------------------------------------
// Main page — comparison hub
// ---------------------------------------------------------------------------

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import FileDropZone from "@/components/comparison/FileDropZone";
import OriginalSelector from "@/components/comparison/OriginalSelector";
import ComparisonView from "@/components/comparison/ComparisonView";
import TextInputPanel from "@/components/comparison/text/TextInputPanel";
import TextDiffViewer from "@/components/comparison/text/TextDiffViewer";
import Tabs from "@/components/ui/Tabs";
import { useComparison } from "@/hooks/useComparison";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Play, RotateCcw, Type, FolderUp, ChevronDown, ChevronUp, Plus } from "lucide-react";

type InputMode = "files" | "text";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("files");
  const [quickOldText, setQuickOldText] = useState("");
  const [quickNewText, setQuickNewText] = useState("");
  const [inputCollapsed, setInputCollapsed] = useState(false);

  const {
    files,
    originalId,
    pairs,
    isComparing,
    error,
    addFiles,
    removeFile,
    selectOriginal,
    runComparison,
    reset,
  } = useComparison();

  const {
    isDragging,
    processFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop: handleDropRaw,
  } = useFileUpload();

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      const processed = await handleDropRaw(e);
      if (processed.length > 0) addFiles(processed);
    },
    [handleDropRaw, addFiles]
  );

  const handleFilesSelected = useCallback(
    async (fileList: FileList) => {
      const processed = await processFiles(fileList);
      if (processed.length > 0) addFiles(processed);
    },
    [processFiles, addFiles]
  );

  const modeTabs = [
    { id: "files", label: "Files", icon: <FolderUp size={14} /> },
    { id: "text", label: "Text", icon: <Type size={14} /> },
  ];

  const hasQuickText = quickOldText.length > 0 || quickNewText.length > 0;
  const hasResults = pairs.length > 0;
  const hasQuickResults = inputMode === "text" && hasQuickText;

  return (
    <div className="app-shell">
      {/* Single toolbar row — logo + tabs + actions */}
      <div className="toolbar">
        <div className="toolbar-left">
          <Image src="/diffs.png" alt="Diffs" width={24} height={24} className="toolbar-logo" />
          <span className="toolbar-title">Diffs</span>
        </div>

        <div className="toolbar-right">
          <Tabs
            tabs={modeTabs}
            activeId={inputMode}
            onChange={(id) => setInputMode(id as InputMode)}
          />
          {inputMode === "files" && files.length > 0 && (
            <>
              <div className="toolbar-divider" />
              <button
                className="btn-primary"
                onClick={runComparison}
                disabled={isComparing || files.length < 2}
              >
                <Play size={14} />
                {isComparing ? "Comparing..." : "Compare"}
              </button>
              <button className="btn-ghost" onClick={reset} title="Reset & clear storage">
                <RotateCcw size={14} />
              </button>
              {hasResults && (
                <button
                  className="btn-ghost"
                  onClick={() => setInputCollapsed(!inputCollapsed)}
                  title={inputCollapsed ? "Show files" : "Hide files"}
                >
                  {inputCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <main className="app-main">
        {/* File upload mode */}
        {inputMode === "files" && (
          <>
            {/* Input section — collapsible */}
            {!inputCollapsed && (
              <section className="input-section">
                {files.length === 0 ? (
                  <FileDropZone
                    isDragging={isDragging}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onFilesSelected={handleFilesSelected}
                    fileCount={files.length}
                  />
                ) : (
                  <div className="files-compact">
                    <OriginalSelector
                      files={files}
                      originalId={originalId}
                      onSelect={selectOriginal}
                      onRemove={removeFile}
                    />
                    <label className="btn-ghost add-files-btn">
                      <Plus size={14} />
                      Add files
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) handleFilesSelected(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </section>
            )}

            {/* Collapsed summary bar */}
            {inputCollapsed && files.length > 0 && (
              <div className="collapsed-summary" onClick={() => setInputCollapsed(false)}>
                <span>{files.length} files loaded · Comparing against <strong>{files.find(f => f.id === originalId)?.name}</strong></span>
                <ChevronDown size={14} />
              </div>
            )}

            {/* Results — takes all remaining space */}
            {hasResults && (
              <section className="results-section results-expanded">
                <ComparisonView pairs={pairs} />
              </section>
            )}
          </>
        )}

        {/* Quick text mode */}
        {inputMode === "text" && (
          <>
            <section className="input-section">
              <TextInputPanel
                oldText={quickOldText}
                newText={quickNewText}
                onOldTextChange={setQuickOldText}
                onNewTextChange={setQuickNewText}
              />
            </section>

            {hasQuickResults && (
              <section className="results-section results-expanded">
                <TextDiffViewer oldText={quickOldText} newText={quickNewText} />
              </section>
            )}
          </>
        )}
      </main>

      {!hasResults && !hasQuickResults && <Footer />}
    </div>
  );
}
