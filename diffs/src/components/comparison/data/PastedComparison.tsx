"use client";
import { useEffect, useState } from "react";
import type { SessionData, ComparisonResult, TableOptions } from "@/lib/types";
import { DEFAULT_TABLE_OPTIONS } from "@/lib/constants";
import { runWorker } from "@/lib/comparison/client";
import JsonViewer from "./JsonViewer";
import TableViewer, { TableSettings } from "./TableViewer";
export default function PastedComparison({
  oldText,
  newText,
  format = "text",
}: {
  oldText: string;
  newText: string;
  format: SessionData["pasteFormat"];
}) {
  const [options, setOptions] = useState<TableOptions>(DEFAULT_TABLE_OPTIONS);
  const [state, setState] = useState<{
    key: string;
    result?: ComparisonResult;
    error?: string;
  } | null>(null);
  const key = JSON.stringify([oldText, newText, format, options]);
  useEffect(() => {
    if (format === "text") return;
    const job = new AbortController();
    const timer = setTimeout(() => {
      runWorker(
        format === "json"
          ? { kind: "json", oldText, newText }
          : { kind: "table", oldText, newText, options },
        job.signal,
      ).then(
        (result) => {
          if (!job.signal.aborted) setState({ key, result });
        },
        (error) => {
          if (!job.signal.aborted)
            setState({
              key,
              error:
                error instanceof Error ? error.message : "Could not compare.",
            });
        },
      );
    }, 180);
    return () => {
      clearTimeout(timer);
      job.abort();
    };
  }, [oldText, newText, format, options, key]);
  const result = state?.key === key ? state.result : undefined;
  return (
    <>
      {format === "table" && (
        <TableSettings
          options={options}
          onChange={setOptions}
          columns={
            result?.type === "table"
              ? result.originalColumns.filter((c) =>
                  result.modifiedColumns.includes(c),
                )
              : []
          }
        />
      )}
      {state?.key === key && state.error ? (
        <p role="alert" className="data-notice">
          {state.error}
        </p>
      ) : result?.type === "json" ? (
        <JsonViewer result={result} />
      ) : result?.type === "table" ? (
        <TableViewer result={result} />
      ) : (
        <p role="status" className="data-empty">
          Comparing…
        </p>
      )}
    </>
  );
}
