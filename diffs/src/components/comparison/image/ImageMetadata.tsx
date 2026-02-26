"use client";

// ---------------------------------------------------------------------------
// ImageMetadata — table comparing image properties
// ---------------------------------------------------------------------------

import React from "react";
import type { ImageMetadata as ImageMetaType } from "@/lib/types";
import { formatFileSize } from "@/lib/utils/file";

interface ImageMetadataProps {
  original: ImageMetaType;
  modified: ImageMetaType;
}

export default function ImageMetadata({ original, modified }: ImageMetadataProps) {
  const rows: { label: string; orig: string; mod: string; changed: boolean }[] = [
    {
      label: "Dimensions",
      orig: `${original.width} × ${original.height}`,
      mod: `${modified.width} × ${modified.height}`,
      changed: original.width !== modified.width || original.height !== modified.height,
    },
    {
      label: "File Size",
      orig: formatFileSize(original.fileSize),
      mod: formatFileSize(modified.fileSize),
      changed: original.fileSize !== modified.fileSize,
    },
    {
      label: "Format",
      orig: original.format,
      mod: modified.format,
      changed: original.format !== modified.format,
    },
    {
      label: "Aspect Ratio",
      orig: original.aspectRatio,
      mod: modified.aspectRatio,
      changed: original.aspectRatio !== modified.aspectRatio,
    },
  ];

  return (
    <div className="metadata-table-wrap">
      <table className="metadata-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Original</th>
            <th>Modified</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={row.changed ? "metadata-changed" : ""}>
              <td className="metadata-label">{row.label}</td>
              <td>{row.orig}</td>
              <td>{row.mod}</td>
              <td>
                <span className={`metadata-status ${row.changed ? "metadata-status-diff" : "metadata-status-same"}`}>
                  {row.changed ? "Changed" : "Same"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
