"use client";
import type { TableOptions, TableComparisonResult } from "@/lib/types";
import { Counts, ReportButton, useRows, Value } from "./shared";
export function TableSettings({
  options,
  columns = [],
  onChange,
  disabled = false,
}: {
  options: TableOptions;
  columns?: string[];
  onChange: (options: TableOptions) => void;
  disabled?: boolean;
}) {
  return (
    <div className="data-settings">
      <label className="field-label">
        Separator
        <select
          aria-label="Separator"
          disabled={disabled}
          value={options.delimiter}
          onChange={(e) =>
            onChange({
              ...options,
              delimiter: e.target.value as TableOptions["delimiter"],
            })
          }
        >
          {[
            ["auto", "Detect automatically"],
            [",", "Comma"],
            ["\t", "Tab"],
            [";", "Semicolon"],
            ["|", "Pipe"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="check-control">
        <input
          type="checkbox"
          disabled={disabled}
          checked={options.headers}
          onChange={(e) =>
            onChange({ ...options, headers: e.target.checked, keyColumn: null })
          }
        />
        First row is headings
      </label>
      <label className="field-label">
        Match rows by
        <select
          aria-label="Match rows by"
          disabled={disabled}
          value={options.keyColumn ?? ""}
          onChange={(e) =>
            onChange({ ...options, keyColumn: e.target.value || null })
          }
        >
          <option value="">Row order</option>
          {[
            ...new Set([
              ...columns,
              ...(options.keyColumn ? [options.keyColumn] : []),
            ]),
          ].map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
export default function TableViewer({
  result,
}: {
  result: TableComparisonResult;
}) {
  const rows = useRows(
    result.rows,
    (row) =>
      `${row.key} ${Object.values(row.before ?? {}).join(" ")} ${Object.values(row.after ?? {}).join(" ")}`,
    (row) => row.kind !== "same",
  );
  const addedColumns = result.modifiedColumns.filter(
    (c) => !result.originalColumns.includes(c),
  );
  const removedColumns = result.originalColumns.filter(
    (c) => !result.modifiedColumns.includes(c),
  );
  const cell = (row: Record<string, string> | null, column: string) =>
    row && Object.hasOwn(row, column) ? row[column] : null;
  return (
    <div className="data-view">
      <div className="data-heading">
        <div>
          <h3>
            {result.equivalent ? "Table data matches" : "Table data changed"}
          </h3>
          <Counts {...result} />
        </div>
        <ReportButton data={result} name="table-comparison" />
      </div>
      <p className="data-note">
        {result.options.keyColumn
          ? `Rows match by unique ${JSON.stringify(result.options.keyColumn)} values. Row order is ignored.`
          : "Rows match by position. Choose a unique key column to follow reordered records."}{" "}
        Columns match by heading; values compare as text.
      </p>
      {(addedColumns.length > 0 || removedColumns.length > 0) && (
        <p className="data-notice">
          Columns added: {addedColumns.join(", ") || "none"}. Columns removed:{" "}
          {removedColumns.join(", ") || "none"}.
        </p>
      )}
      {rows.controls}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Row / change</th>
              {result.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.visible.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  <code>{row.key}</code>
                  <small>
                    {row.kind} · {row.originalRow ?? "—"} →{" "}
                    {row.modifiedRow ?? "—"}
                  </small>
                </th>
                {result.columns.map((column) => (
                  <td
                    key={column}
                    className={
                      row.changedColumns.includes(column) ? "cell-changed" : ""
                    }
                  >
                    {row.changedColumns.includes(column) ? (
                      <>
                        <small>Original</small>
                        <Value value={cell(row.before, column)} />
                        <small>Modified</small>
                        <Value value={cell(row.after, column)} />
                      </>
                    ) : (
                      <Value value={cell(row.after, column)} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.visible.length && (
        <p className="data-empty">No matching row changes to show.</p>
      )}
    </div>
  );
}
