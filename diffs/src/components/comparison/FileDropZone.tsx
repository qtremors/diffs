"use client";
import { useRef } from "react";
import { Files, ArrowUpRight, Plus } from "lucide-react";

export default function FileDropZone({
  onFilesSelected,
  compact = false,
  disabled = false,
}: {
  onFilesSelected: (files: FileList) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={compact ? "file-picker-compact" : "drop-zone"}>
      <input
        ref={input}
        type="file"
        hidden
        tabIndex={-1}
        multiple
        aria-label="File selection"
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files?.length) onFilesSelected(event.target.files);
          event.target.value = "";
        }}
      />
      {compact ? (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => input.current?.click()}
          disabled={disabled}
        >
          <Plus size={16} />
          Add files
        </button>
      ) : (
        <>
          <div className="drop-symbol">
            <Files size={32} strokeWidth={1.2} />
            <span className="drop-symbol-plus">+</span>
          </div>
          <h2>Drop your files here</h2>
          <p>Choose an original and a version to compare.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => input.current?.click()}
            disabled={disabled}
          >
            Choose files
            <ArrowUpRight size={16} />
          </button>
          <span className="drop-hint">
            Documents, data, images, or any file · Up to 12 sources
          </span>
        </>
      )}
    </div>
  );
}
