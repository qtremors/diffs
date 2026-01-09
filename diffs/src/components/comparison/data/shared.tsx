"use client";
import { useState } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { downloadFile } from "@/lib/utils/file";
export function ReportButton({
  data,
  name = "comparison",
}: {
  data: unknown;
  name?: string;
}) {
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={() =>
        downloadFile(
          JSON.stringify(
            { format: "diffs-report", version: 1, comparison: data },
            null,
            2,
          ),
          `${name}.json`,
          "application/json",
        )
      }
    >
      <Download size={14} />
      Report
    </button>
  );
}
export function Counts({
  added,
  removed,
  changed,
  same,
}: {
  added: number;
  removed: number;
  changed: number;
  same?: number;
}) {
  return (
    <div className="data-counts">
      <span>+ {added.toLocaleString()} added</span>
      <span>− {removed.toLocaleString()} removed</span>
      <span>~ {changed.toLocaleString()} changed</span>
      {same !== undefined && <span>= {same.toLocaleString()} same</span>}
    </div>
  );
}
export function useRows<T>(
  rows: T[],
  search: (row: T) => string,
  changed: (row: T) => boolean,
) {
  const [query, setQuery] = useState("");
  const [changes, setChanges] = useState(true);
  const [page, setPage] = useState(0);
  const filtered = rows.filter(
    (row) =>
      (!changes || changed(row)) &&
      search(row).toLowerCase().includes(query.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 100));
  const current = Math.min(page, pages - 1);
  return {
    visible: filtered.slice(current * 100, (current + 1) * 100),
    controls: (
      <div className="data-controls">
        <input
          aria-label="Search comparison"
          placeholder="Search…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        <label className="check-control">
          <input
            type="checkbox"
            checked={changes}
            onChange={(e) => {
              setChanges(e.target.checked);
              setPage(0);
            }}
          />
          Changes only
        </label>
        <span className="data-pagination">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous results"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {filtered.length.toLocaleString()} results · {current + 1}/{pages}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Next results"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </span>
      </div>
    ),
  };
}
export function Value({
  value,
  type,
}: {
  value: string | null;
  type?: string;
}) {
  if (value === null) return <span className="missing-value">Absent</span>;
  return (
    <div className="data-value">
      {type && <small>{type}</small>}
      {value.length <= 500 ? (
        <pre>{value || '""'}</pre>
      ) : (
        <details>
          <summary>
            {value.slice(0, 160)}… ({value.length.toLocaleString()} characters)
          </summary>
          <pre>{value}</pre>
        </details>
      )}
    </div>
  );
}
