"use client";
import { FileText, ImageIcon, X, Check } from "lucide-react";
import type { ComparisonFile } from "@/lib/types";
import { formatFileSize } from "@/lib/utils/file";

export default function OriginalSelector({
  files,
  originalId,
  onSelect,
  onRemove,
}: {
  files: ComparisonFile[];
  originalId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="file-list" aria-label="Loaded files">
      {files.map((file) => (
        <div
          key={file.id}
          className={`file-card ${file.id === originalId ? "file-card-original" : ""}`}
        >
          <button
            type="button"
            className="file-select"
            aria-pressed={file.id === originalId}
            onClick={() => onSelect(file.id)}
            title={`Use ${file.name} as original`}
          >
            <span className="file-icon">
              {file.type !== "image" ? (
                <FileText size={20} strokeWidth={1.4} />
              ) : (
                <ImageIcon size={20} strokeWidth={1.4} />
              )}
            </span>
            <span className="file-detail">
              <span className="file-card-name">{file.name}</span>
              <span className="file-card-meta">
                {
                  {
                    text: "Text",
                    image: "Image",
                    json: "JSON",
                    table: "Table",
                    pdf: "PDF text",
                    binary: "Bytes",
                    folder: "Folder",
                  }[file.type]
                }
                <span>·</span>
                {formatFileSize(file.size)}
              </span>
            </span>
            {file.id === originalId && (
              <span className="original-badge">
                <Check size={12} />
                Original
              </span>
            )}
          </button>
          <button
            type="button"
            className="icon-button file-remove"
            aria-label={`Remove ${file.name}`}
            onClick={() => onRemove(file.id)}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
