"use client";

// ---------------------------------------------------------------------------
// FileDropZone — multi-file drag-and-drop + click-to-upload
// ---------------------------------------------------------------------------

import React, { useRef } from "react";
import { Upload, FileUp } from "lucide-react";

interface FileDropZoneProps {
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFilesSelected: (files: FileList) => void;
  fileCount: number;
}

export default function FileDropZone({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFilesSelected,
  fileCount,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`drop-zone ${isDragging ? "drop-zone-active" : ""}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files) onFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="drop-zone-content">
        {isDragging ? (
          <>
            <FileUp size={40} className="drop-zone-icon drop-zone-icon-active" />
            <p className="drop-zone-text">Release to add files</p>
          </>
        ) : (
          <>
            <Upload size={40} className="drop-zone-icon" />
            <p className="drop-zone-text">
              Drag & drop files here, or <span className="drop-zone-link">browse</span>
            </p>
            <p className="drop-zone-hint">
              Text files, images, code — anything you want to compare
            </p>
          </>
        )}
        {fileCount > 0 && (
          <p className="drop-zone-count">{fileCount} file{fileCount !== 1 ? "s" : ""} loaded</p>
        )}
      </div>
    </div>
  );
}
