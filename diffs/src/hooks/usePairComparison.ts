"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type {
  SessionData,
  ComparisonPair,
  ComparisonOptions,
} from "@/lib/types";
import { compare } from "@/lib/comparison/engine";
export function usePairComparison(getSnapshot: () => SessionData) {
  const [pairs, setPairs] = useState<ComparisonPair[]>([]);
  const [activeId, setActiveId] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const activeJob = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const stop = useCallback(() => {
    revision.current++;
    activeJob.current?.abort();
    activeJob.current = null;
    setIsComparing(false);
  }, []);
  useEffect(() => () => activeJob.current?.abort(), []);
  const invalidate = useCallback(() => {
    stop();
    setPairs([]);
    setActiveId("");
  }, [stop]);
  const computePair = useCallback(
    async (
      id: string,
      sourcePairs: ComparisonPair[],
      changes: ComparisonOptions = {},
    ) => {
      stop();
      const job = new AbortController();
      activeJob.current = job;
      const current = revision.current;
      setActiveId(id);
      const pair = sourcePairs.find((item) => item.modified.id === id);
      if (!pair) return;
      const options = { ...pair.options, ...changes };
      const cached =
        pair.result &&
        pair.result.type !== "error" &&
        JSON.stringify(pair.resultOptions ?? {}) === JSON.stringify(options);
      if (cached) return;
      setPairs((prev) =>
        prev.map((item) =>
          item.modified.id === id
            ? {
                ...item,
                options,
                result:
                  item.result?.type === "image" &&
                  (!options.mode || options.mode === "auto")
                    ? item.result
                    : null,
              }
            : item,
        ),
      );
      setIsComparing(true);
      try {
        const result = await compare(
          pair.original,
          pair.modified,
          options,
          job.signal,
        );
        if (revision.current !== current || job.signal.aborted) return;
        setPairs((prev) =>
          prev.map((item) =>
            item.modified.id === id
              ? { ...item, result, resultOptions: options }
              : item,
          ),
        );
      } catch (error) {
        if (job.signal.aborted || revision.current !== current) return;
        setPairs((prev) =>
          prev.map((item) =>
            item.modified.id === id
              ? {
                  ...item,
                  resultOptions: options,
                  result: {
                    type: "error",
                    reason:
                      error instanceof Error
                        ? error.message
                        : "Comparison failed.",
                  },
                }
              : item,
          ),
        );
      } finally {
        if (revision.current === current) setIsComparing(false);
      }
    },
    [stop],
  );

  const runComparison = useCallback(() => {
    const snapshot = getSnapshot();
    const original = snapshot.files.find(
      (file) => file.id === snapshot.originalId,
    );
    if (!original || snapshot.files.length < 2) return;
    const next = snapshot.files
      .filter((file) => file.id !== original.id)
      .map((modified) => ({ original, modified, result: null }));
    setPairs(next);
    void computePair(next[0].modified.id, next);
  }, [computePair, getSnapshot]);

  return {
    pairs,
    activeId,
    isComparing,
    invalidate,
    runComparison,
    selectCandidate: (id: string, options?: ComparisonOptions) =>
      computePair(id, pairs, options),
    cancel: () => {
      stop();
      setPairs((prev) =>
        prev.map((pair) =>
          pair.result ? { ...pair, options: pair.resultOptions } : pair,
        ),
      );
    },
  };
}
