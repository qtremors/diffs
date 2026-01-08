"use client";
import { useEffect, useState } from "react";
import { runWorker } from "@/lib/comparison/client";
import type { TextComparisonResult } from "@/lib/types";

export function useTextComparison(
  oldText: string,
  newText: string,
  ignoreWhitespace: boolean,
  enabled = true,
) {
  const [state, setState] = useState<{
    oldText: string;
    newText: string;
    ignoreWhitespace: boolean;
    result?: TextComparisonResult;
    error?: string;
  } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const job = new AbortController();
    const timer = setTimeout(() => {
      runWorker(
        { kind: "text", oldText, newText, options: { ignoreWhitespace } },
        job.signal,
      )
        .then((result) => {
          if (!job.signal.aborted)
            setState({ oldText, newText, ignoreWhitespace, result });
        })
        .catch((error) => {
          if (!job.signal.aborted)
            setState({
              oldText,
              newText,
              ignoreWhitespace,
              error:
                error instanceof Error ? error.message : "Comparison failed.",
            });
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      job.abort();
    };
  }, [oldText, newText, ignoreWhitespace, enabled]);
  const current =
    state?.oldText === oldText &&
    state.newText === newText &&
    state.ignoreWhitespace === ignoreWhitespace;
  return {
    result: current ? state?.result : undefined,
    error: current ? state?.error : undefined,
    pending: enabled && !current,
  };
}
