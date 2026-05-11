"use client";
import { useState } from "react";
import type { BinaryComparisonResult, ComparisonFile } from "@/lib/types";
import { ReportButton } from "./shared";
import { formatFileSize } from "@/lib/utils/file";
export default function BinaryViewer({
  result,
  original,
  modified,
}: {
  result: BinaryComparisonResult;
  original: ComparisonFile;
  modified: ComparisonFile;
}) {
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState("");
  const size = Math.max(result.originalSize, result.modifiedSize);
  const maxPage = Math.max(0, Math.ceil(size / 256) - 1);
  const page = Math.min(position, maxPage);
  const start = page * 256;
  const valid = /^(?:0x[0-9a-f]+|[0-9]+)$/i.test(input) && Number(input) < size;
  return (
    <div className="data-view">
      <div className="data-heading">
        <div>
          <h3>
            {result.identical
              ? "Files are byte-for-byte identical"
              : `${result.differentBytes.toLocaleString()} bytes differ at matching offsets`}
          </h3>
          <p className="data-note">
            Original {formatFileSize(result.originalSize)} · Modified{" "}
            {formatFileSize(result.modifiedSize)} ·{" "}
            {result.rangeCount.toLocaleString()} changed ranges
          </p>
        </div>
        <ReportButton data={result} name="byte-comparison" />
      </div>
      <p className="data-note">
        Raw bytes work for any format. Insertions shift later offsets; this view
        compares positions rather than decoding the format.
      </p>
      {result.ranges.length > 0 && (
        <label className="field-label">
          Jump to changed range
          <select
            value=""
            onChange={(e) => {
              if (e.target.value)
                setPosition(Math.floor(Number(e.target.value) / 256));
            }}
          >
            <option value="">Select a byte range</option>
            {result.ranges.map((range) => (
              <option key={range.start} value={String(range.start)}>
                0x{range.start.toString(16)}–0x{(range.end - 1).toString(16)} ·{" "}
                {range.end - range.start} bytes
              </option>
            ))}
          </select>
        </label>
      )}
      {result.rangeCount > result.ranges.length && (
        <p className="data-note">
          Showing the first 2,000 ranges; the total includes every changed
          range.
        </p>
      )}
      <form
        className="data-controls"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setPosition(Math.floor(Number(input) / 256));
        }}
      >
        <label className="field-label">
          Byte offset
          <input
            placeholder="0 or 0x100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Byte offset"
          />
        </label>
        <button type="submit" className="btn-secondary" disabled={!valid}>
          Go
        </button>
        <span className="data-pagination">
          <button
            type="button"
            className="btn-secondary"
            disabled={page === 0}
            onClick={() => setPosition(page - 1)}
          >
            Previous bytes
          </button>
          <span>
            {page + 1}/{maxPage + 1}
          </span>
          <button
            type="button"
            className="btn-secondary"
            disabled={page === maxPage}
            onClick={() => setPosition(page + 1)}
          >
            Next bytes
          </button>
        </span>
      </form>
      <div className="hex-pair">
        {[original, modified].map((file, side) => (
          <div className="hex-panel" key={side}>
            <h4>{side === 0 ? "Original" : "Modified"}</h4>
            <div className="hex-scroll">
              <table className="hex-table">
                <thead>
                  <tr>
                    <th>Offset</th>
                    <th>Hexadecimal bytes</th>
                    <th>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    { length: Math.min(16, Math.ceil((size - start) / 16)) },
                    (_, i) => {
                      const offset = start + i * 16;
                      return (
                        <tr key={offset}>
                          <th>{offset.toString(16).padStart(8, "0")}</th>
                          <td>
                            {Array.from({ length: 16 }, (_, j) => {
                              const index = offset + j;
                              const byte = file.bytes?.[index];
                              return (
                                <span
                                  key={j}
                                  className={
                                    original.bytes?.[index] !==
                                    modified.bytes?.[index]
                                      ? "hex-changed"
                                      : ""
                                  }
                                  title={`Offset ${index}`}
                                >
                                  {byte === undefined
                                    ? "··"
                                    : byte.toString(16).padStart(2, "0")}
                                </span>
                              );
                            })}
                          </td>
                          <td>
                            {Array.from(
                              file.bytes?.subarray(offset, offset + 16) ?? [],
                              (byte) =>
                                byte >= 32 && byte <= 126
                                  ? String.fromCharCode(byte)
                                  : ".",
                            ).join("")}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      {size === 0 && <p className="data-empty">Both files are empty.</p>}
    </div>
  );
}
