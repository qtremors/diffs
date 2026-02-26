"use client";

// ---------------------------------------------------------------------------
// OriginalSelector — pick which file is the baseline original
// ---------------------------------------------------------------------------

import React from "react";
import { Crown, X, FileText, ImageIcon } from "lucide-react";
import type { ComparisonFile } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import { formatFileSize } from "@/lib/utils/file";

interface OriginalSelectorProps {
  files: ComparisonFile[];
  originalId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function OriginalSelector({
  files,
  originalId,
  onSelect,
  onRemove,
}: OriginalSelectorProps) {
  if (files.length === 0) return null;

  return (
    <div className="selector-container">
      <p className="selector-label">
        Select the <strong>original</strong> file — all others will be compared against it.
      </p>
      <div className="selector-grid">
        {files.map((file) => {
          const isOriginal = file.id === originalId;
          return (
            <div
              key={file.id}
              className={`file-card ${isOriginal ? "file-card-original" : ""}`}
              onClick={() => onSelect(file.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(file.id);
              }}
            >
              <div className="file-card-header">
                <div className="file-card-icon">
                  {file.type === "image" ? (
                    <ImageIcon size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                </div>
                <span className="file-card-name" title={file.name}>
                  {file.name}
                </span>
                <button
                  className="file-card-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="file-card-meta">
                <Badge variant={file.type === "image" ? "image" : file.type === "text" ? "text" : "unknown"}>
                  {file.type.toUpperCase()}
                </Badge>
                <span className="file-card-size">{formatFileSize(file.size)}</span>
              </div>

              {isOriginal && (
                <div className="file-card-original-badge">
                  <Crown size={12} />
                  <span>Original</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
