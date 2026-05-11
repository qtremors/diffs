"use client";
import type { FolderComparisonResult } from "@/lib/types";
import { formatFileSize } from "@/lib/utils/file";
import { Counts, ReportButton, useRows } from "./shared";
export default function FolderViewer({
  result,
}: {
  result: FolderComparisonResult;
}) {
  const rows = useRows(
    result.entries,
    (row) => row.path,
    (row) => row.kind !== "same",
  );
  return (
    <div className="data-view">
      <div className="data-heading">
        <div>
          <h3>
            {result.equivalent ? "Folder files match" : "Folder files changed"}
          </h3>
          <Counts {...result} />
        </div>
        <ReportButton data={result} name="folder-comparison" />
      </div>
      <p className="data-note">
        Files match by exact relative path and SHA-256. Folder names are
        ignored. Renames appear as added and removed files. Empty folders are
        excluded. Only paths, sizes, and fingerprints are retained.
      </p>
      {rows.controls}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Relative path / change</th>
              <th>Original</th>
              <th>Modified</th>
            </tr>
          </thead>
          <tbody>
            {rows.visible.map((row) => (
              <tr key={row.path}>
                <th scope="row">
                  <code>{row.path}</code>
                  <small>{row.kind}</small>
                </th>
                {[row.before, row.after].map((entry, i) => (
                  <td key={i}>
                    {entry ? (
                      <>
                        <span>{formatFileSize(entry.size)}</span>
                        <code className="small-hash">{entry.hash}</code>
                      </>
                    ) : (
                      "Absent"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.visible.length && (
        <p className="data-empty">No matching file changes to show.</p>
      )}
    </div>
  );
}
