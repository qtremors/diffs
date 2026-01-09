"use client";
import type { JsonComparisonResult } from "@/lib/types";
import { Counts, ReportButton, useRows, Value } from "./shared";
export default function JsonViewer({
  result,
}: {
  result: JsonComparisonResult;
}) {
  const rows = useRows(
    result.changes,
    (row) => `${row.path} ${row.before?.raw ?? ""} ${row.after?.raw ?? ""}`,
    () => true,
  );
  return (
    <div className="data-view">
      <div className="data-heading">
        <div>
          <h3>
            {result.equivalent
              ? result.identical
                ? "JSON matches"
                : "Same JSON data; source formatting differs"
              : "JSON fields changed"}
          </h3>
          <Counts {...result} />
        </div>
        <ReportButton data={result} name="json-comparison" />
      </div>
      <p className="data-note">
        Objects match by field name; arrays match by position. Numeric values
        retain full precision. Paths use JSON Pointer; an empty path represents
        the document.
      </p>
      {rows.controls}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Path / change</th>
              <th>Original</th>
              <th>Modified</th>
            </tr>
          </thead>
          <tbody>
            {rows.visible.map((row) => (
              <tr key={row.path}>
                <th scope="row">
                  <code>{row.path || "(document)"}</code>
                  <small>{row.kind}</small>
                </th>
                <td>
                  <Value
                    value={row.before?.raw ?? null}
                    type={row.before?.kind}
                  />
                </td>
                <td>
                  <Value
                    value={row.after?.raw ?? null}
                    type={row.after?.kind}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.visible.length && (
        <p className="data-empty">No field changes to show.</p>
      )}
    </div>
  );
}
