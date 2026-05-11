"use client";
import { LoaderCircle, Play } from "lucide-react";
import type { useComparison } from "@/hooks/useComparison";
import FileDropZone from "./FileDropZone";
import FolderPicker from "./FolderPicker";
import OriginalSelector from "./OriginalSelector";
import FileDetails from "./FileDetails";
export default function FileWorkspace({
  app,
}: {
  app: ReturnType<typeof useComparison>;
}) {
  const busy = app.isReading || app.isComparing;
  return app.files.length === 0 ? (
    <>
      <FileDropZone
        onFilesSelected={(files) => {
          void app.addSelectedFiles(files);
        }}
        disabled={busy}
      />
      <div className="folder-entry">
        <FolderPicker
          onSelect={(files) => {
            void app.addFolder(files);
          }}
          disabled={busy}
        />
        <span>Compare two folder snapshots by path and SHA-256.</span>
      </div>
    </>
  ) : (
    <>
      <p className="section-description">
        Select the original. Each other file is compared against it.
      </p>
      <OriginalSelector
        files={app.files}
        originalId={app.originalId}
        onSelect={app.selectOriginal}
        onRemove={app.removeFile}
      />
      <div className="file-actions">
        <FileDropZone
          compact
          onFilesSelected={(files) => {
            void app.addSelectedFiles(files);
          }}
          disabled={app.isReading || app.files.length >= 12}
        />
        <FolderPicker
          onSelect={(files) => {
            void app.addFolder(files);
          }}
          disabled={app.isReading || app.files.length >= 12}
        />
        <span className="file-limit">10 MB per file · 30 MB total</span>
        <div className="compare-actions">
          {app.isComparing ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={app.cancel}
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            disabled={app.files.length < 2 || busy}
            onClick={app.runComparison}
          >
            {busy ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Play size={14} />
            )}
            {app.isReading
              ? "Opening files…"
              : app.isComparing
                ? "Comparing…"
                : "Compare files"}
          </button>
        </div>
      </div>
      <FileDetails files={app.files} />
    </>
  );
}
